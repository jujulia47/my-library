"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import type { Database } from "@/utils/typings/supabase";

type BookLanguage = Database["public"]["Enums"]["book_language"];

const allowedLanguages: BookLanguage[] = [
  "pt_BR",
  "en",
  "es",
  "fr",
  "it",
  "de",
  "ja",
  "other",
];

/**
 * Em sucesso, redireciona pro detail do livro recém-criado (redirect throws
 * NEXT_REDIRECT internamente, intercept Next). Em erro, retorna ActionResult
 * com `field` apontado quando aplicável (ISBN duplicado → field: "isbn",
 * título duplicado → field: "title" via book_user_slug_key).
 */
export async function createBookMinimal(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const title = (formData.get("title") as string)?.trim();
  if (!title)
    return { ok: false, message: "Título obrigatório.", field: "title" };

  const isbn = ((formData.get("isbn") as string) || "").trim() || null;
  const languageRaw = (formData.get("language") as string) || null;
  const language = allowedLanguages.includes(languageRaw as BookLanguage)
    ? (languageRaw as BookLanguage)
    : null;

  const authorIds = formData.getAll("author_ids").map(String).filter(Boolean);

  const serieId = (formData.get("serie_id") as string) || null;
  const volumeRaw = formData.get("volume") as string | null;
  const volume =
    volumeRaw && volumeRaw !== "" ? Number(volumeRaw) || null : null;

  const cover = formData.get("cover") as File | null;
  let coverPath: string | null = null;
  if (cover && cover.size > 0) {
    const ext = cover.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { data: coverData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, cover, { cacheControl: "3600", upsert: false });
    if (uploadError)
      return { ok: false, ...translateSupabaseError(uploadError) };
    if (coverData) coverPath = coverData.path;
  }

  // Slug é gerado direto do título; conflito sobe como erro Postgres
  // (book_user_slug_key) e vira erro inline no campo "title".
  const slug = formateTitleToSlug(title);

  // acquired_at default = hoje. Garante que livros novos contam pra "Aquisições
  // do ano" mesmo sem o user preencher campos de aquisição (sessão 15.1).
  // O user pode editar depois via BookFull se a data real foi outra.
  const today = new Date();
  const acquiredAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data: bookData, error: bookError } = await supabase
    .from("book")
    .insert({
      title,
      slug,
      isbn,
      language,
      cover: coverPath,
      serie_id: serieId,
      volume,
      user_id: user.id,
      ownership_status: "owned",
      acquired_at: acquiredAt,
    })
    .select("id, slug")
    .single();

  if (bookError || !bookData) {
    return { ok: false, ...translateSupabaseError(bookError) };
  }

  // Sessão 17.2.6: trigger automático foi dropado, action insere a entry
  // inicial do histórico. `changed_at = acquiredAt` (data que o user
  // efetivamente "adquiriu" — hoje pra livros recém-cadastrados via Minimal).
  await supabase.from("book_status_history").insert({
    book_id: bookData.id,
    user_id: user.id,
    status: "owned",
    changed_at: `${acquiredAt}T12:00:00Z`,
    notes: "criado",
  });

  if (authorIds.length > 0) {
    const rows = authorIds.map((author_id) => ({
      book_id: bookData.id,
      author_id,
      user_id: user.id,
    }));
    const { error: relError } = await supabase
      .from("book_author")
      .insert(rows);
    if (relError) return { ok: false, ...translateSupabaseError(relError) };

    // Auto-cria entry em author_bibliography pra cada autor (sessão 13.1).
    // Upsert com ignoreDuplicates: a unique constraint
    // (author_id, title_normalized) elimina entradas redundantes —
    // entradas já cadastradas manualmente pelo user (mesmo título com
    // acentos diferentes) são preservadas, não duplicadas. BookMinimal
    // não tem publication_year; fica null e pode ser preenchido depois
    // via BookFull.
    const bibRows = authorIds.map((author_id) => ({
      user_id: user.id,
      author_id,
      title,
      publication_year: null,
    }));
    await supabase
      .from("author_bibliography")
      .upsert(bibRows, {
        onConflict: "author_id,title_normalized",
        ignoreDuplicates: true,
      });
  }

  revalidatePath("/book");

  // "Marcar como adquirido": se o livro veio de um item de wishlist, migra
  // todos os collection_item que apontavam pra essa wishlist (pode estar em
  // múltiplas coleções) pra apontarem ao book recém-criado, com
  // was_wishlist=true pra preservar memória histórica. Importante: a migração
  // tem que vir ANTES do delete da wishlist, pq a FK collection_item.wishlist_id
  // tem on delete cascade — deletar a wishlist primeiro apagaria os items.
  const fromWishlist = formData.get("from_wishlist");
  if (typeof fromWishlist === "string" && fromWishlist) {
    await supabase
      .from("collection_item")
      .update({
        book_id: bookData.id,
        wishlist_id: null,
        was_wishlist: true,
      })
      .eq("wishlist_id", fromWishlist);

    await supabase.from("wishlist").delete().eq("id", fromWishlist);
    revalidatePath("/wishlist");
    revalidatePath("/collection");
  }

  const andRegisterReading = formData.get("and_register_reading");
  if (andRegisterReading) {
    // Mesmo com ?from=, o "Cadastrar e registrar leitura" sempre vai pra
    // detail do livro novo — o usuário escolheu a ação que abre o modal de
    // leitura ali. Honrar `from` aqui pularia a leitura.
    redirect(`/book/${bookData.slug}?action=new-reading`);
  }

  // Em sucesso, se veio com ?from= seguro, volta pra origem; senão, vai
  // pra detail do livro recém-criado (comportamento antigo).
  const rawFrom = formData.get("from");
  if (typeof rawFrom === "string" && rawFrom.startsWith("/") && !rawFrom.startsWith("//")) {
    redirect(rawFrom);
  }
  redirect(`/book/${bookData.slug}`);
}
