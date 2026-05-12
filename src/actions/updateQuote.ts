"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import type { Database } from "@/utils/typings/supabase";

type QuoteUpdate = Database["public"]["Tables"]["quote"]["Update"];

/**
 * Atualiza citação. Tipo (linked/standalone) é editável: trocar de vinculada
 * pra avulsa zera book_id/page/chapter; trocar de avulsa pra vinculada zera
 * source. Slug acompanha o texto (regerado server-side, ver sessão 6.4).
 */
export default async function updateQuote(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "Citação inválida." };

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

  // Slug regerado a partir do texto novo (igual sessão 6.4 + sufixo UUID).
  const slugSeed = text.slice(0, 60) || crypto.randomUUID().slice(0, 8);
  const newSlug = `${formateTitleToSlug(slugSeed)}-${crypto.randomUUID().slice(0, 6)}`;

  const updateData: QuoteUpdate = {
    text,
    slug: newSlug,
    book_id,
    page,
    chapter,
    source,
    author_name,
    note,
  };

  const { error } = await supabase
    .from("quote")
    .update(updateData)
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/quote");
  revalidatePath(`/quote/${newSlug}`);
  if (book_id) {
    const { data: book } = await supabase
      .from("book")
      .select("slug")
      .eq("id", book_id)
      .maybeSingle();
    if (book?.slug) revalidatePath(`/book/${book.slug}`);
  }

  // Se veio com ?from= seguro, volta pra origem; mas se `from` aponta pra
  // detail page desta mesma quote (`/quote/{algumSlug}`), o slug antigo já
  // não existe — força o slug novo.
  const rawFrom = formData.get("from");
  let redirectTo = `/quote/${newSlug}`;
  if (
    typeof rawFrom === "string" &&
    rawFrom.startsWith("/") &&
    !rawFrom.startsWith("//")
  ) {
    if (rawFrom.startsWith("/quote/") && rawFrom !== "/quote") {
      redirectTo = `/quote/${newSlug}`;
    } else {
      redirectTo = rawFrom;
    }
  }
  return { ok: true, data: { redirectTo } };
}
