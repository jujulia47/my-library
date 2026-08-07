"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import type { Database } from "@/utils/typings/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

type BookLanguage = Database["public"]["Enums"]["book_language"];
type DB = SupabaseClient<Database>;

const allowedLanguages: BookLanguage[] = [
  "pt_BR", "en", "es", "fr", "it", "de", "ja", "other",
];

export type ScanDraft = {
  title: string;
  authors?: string[];
  language?: string | null;
  publisher?: string | null;
  publication_year?: number | null;
  original_title?: string | null;
  pages?: number | null;
  synopsis?: string | null;
  isbn?: string | null;
  /** URL externa da capa (Google/Open Library) — guardada direto. */
  cover_url?: string | null;
  categories?: string[];
};

async function findOrCreateAuthor(
  supabase: DB,
  userId: string,
  name: string,
): Promise<string | null> {
  const clean = name.trim();
  if (!clean) return null;
  const { data: existing } = await supabase
    .from("author")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", clean)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("author")
    .insert({ name: clean, slug: formateTitleToSlug(clean), user_id: userId })
    .select("id")
    .single();
  if (error || !created) {
    // Provável conflito de slug — tenta reencontrar.
    const { data: retry } = await supabase
      .from("author")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", clean)
      .limit(1)
      .maybeSingle();
    return retry?.id ?? null;
  }
  return created.id;
}

async function findOrCreateCategory(
  supabase: DB,
  userId: string,
  name: string,
): Promise<string | null> {
  const clean = name.trim();
  if (!clean) return null;
  const { data: existing } = await supabase
    .from("category")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", clean)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("category")
    .insert({ name: clean, slug: formateTitleToSlug(clean), user_id: userId })
    .select("id")
    .single();
  if (error || !created) {
    const { data: retry } = await supabase
      .from("category")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", clean)
      .limit(1)
      .maybeSingle();
    return retry?.id ?? null;
  }
  return created.id;
}

/**
 * Cria um livro a partir do rascunho do scanner: SÓ campos bibliográficos.
 * Autores e categorias entram por NOME (find-or-create). A capa fica como URL
 * externa (imagesUrl repassa http direto). Campos de acervo ficam pro user.
 */
export async function createBookFromScan(
  draft: ScanDraft,
): Promise<ActionResult<{ slug: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const title = draft.title?.trim();
  if (!title) return { ok: false, message: "Título obrigatório.", field: "title" };

  const language = allowedLanguages.includes(draft.language as BookLanguage)
    ? (draft.language as BookLanguage)
    : null;

  const { data: bookData, error: bookError } = await supabase
    .from("book")
    .insert({
      title,
      slug: formateTitleToSlug(title),
      isbn: draft.isbn?.trim() || null,
      language,
      cover: draft.cover_url?.trim() || null,
      pages: draft.pages ?? null,
      publisher: draft.publisher?.trim() || null,
      publication_year: draft.publication_year ?? null,
      synopsis: draft.synopsis?.trim() || null,
      original_title: draft.original_title?.trim() || null,
      user_id: user.id,
      ownership_status: "owned",
      acquired_at: null,
    })
    .select("id, slug")
    .single();
  if (bookError || !bookData) {
    return { ok: false, ...translateSupabaseError(bookError) };
  }

  await supabase.from("book_status_history").insert({
    book_id: bookData.id,
    user_id: user.id,
    status: "owned",
    changed_at: new Date().toISOString(),
    notes: "criado via scanner",
  });

  // Autores por nome.
  const authorIds: string[] = [];
  for (const name of draft.authors ?? []) {
    const id = await findOrCreateAuthor(supabase, user.id, name);
    if (id) authorIds.push(id);
  }
  if (authorIds.length) {
    await supabase.from("book_author").insert(
      authorIds.map((author_id) => ({
        book_id: bookData.id,
        author_id,
        user_id: user.id,
      })),
    );
    await supabase.from("author_bibliography").upsert(
      authorIds.map((author_id) => ({
        user_id: user.id,
        author_id,
        title,
        publication_year: draft.publication_year ?? null,
      })),
      { onConflict: "author_id,title_normalized", ignoreDuplicates: true },
    );
  }

  // Categorias por nome.
  const categoryIds: string[] = [];
  for (const name of draft.categories ?? []) {
    const id = await findOrCreateCategory(supabase, user.id, name);
    if (id) categoryIds.push(id);
  }
  if (categoryIds.length) {
    await supabase.from("book_category").insert(
      categoryIds.map((category_id) => ({
        book_id: bookData.id,
        category_id,
        user_id: user.id,
      })),
    );
  }

  revalidatePath("/book");
  return { ok: true, data: { slug: bookData.slug } };
}
