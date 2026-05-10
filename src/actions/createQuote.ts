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

type QuoteInsert = Database["public"]["Tables"]["quote"]["Insert"];

/**
 * Cria citação avulsa OU vinculada a livro. Discriminada por `type` no FormData.
 * - linked: book_id obrigatório, page/chapter opcionais, source ignorado
 * - standalone: book_id=null, source/author_name livres, page/chapter ignorados
 *
 * Em sucesso, faz redirect para /quote/{slug}. NEXT_REDIRECT é interceptado
 * pelo Next; o client filtra a mensagem no catch.
 */
export default async function createQuote(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const type = (formData.get("type") as string) === "standalone" ? "standalone" : "linked";

  const text = (formData.get("text") as string)?.trim();
  if (!text || text.length < 3)
    return {
      ok: false,
      message: "A citação deve ter pelo menos 3 caracteres.",
      field: "text",
    };

  let book_id: string | null = null;
  let page: number | null = null;
  let chapter: string | null = null;
  let source: string | null = null;

  if (type === "linked") {
    book_id = (formData.get("book_id") as string) || null;
    if (!book_id)
      return { ok: false, message: "Selecione um livro.", field: "book_id" };

    const pageRaw = formData.get("page") as string | null;
    page = pageRaw && pageRaw !== "" ? Number(pageRaw) || null : null;
    chapter = (formData.get("chapter") as string)?.trim() || null;
  } else {
    source = (formData.get("source") as string)?.trim() || null;
  }

  const author_name = (formData.get("author_name") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;

  const slugSeed = text.slice(0, 60) || crypto.randomUUID().slice(0, 8);
  const slug = `${formateTitleToSlug(slugSeed)}-${crypto.randomUUID().slice(0, 6)}`;

  const insertData: QuoteInsert = {
    text,
    slug,
    book_id,
    page,
    chapter,
    source,
    author_name,
    note,
    user_id: user.id,
  };

  const { error } = await supabase.from("quote").insert(insertData);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/quote");
  if (book_id) {
    const { data: book } = await supabase
      .from("book")
      .select("slug")
      .eq("id", book_id)
      .maybeSingle();
    if (book?.slug) revalidatePath(`/book/${book.slug}`);
  }
  redirect(`/quote/${slug}`);
}
