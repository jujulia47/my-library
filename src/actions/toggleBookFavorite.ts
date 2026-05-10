"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Inverte `is_favorite` do livro. Mesmo pattern de `toggleCollectionFavorite`:
 * gatilho síncrono pra coração no BookCard e detail page; o caminho do
 * `updateBookFull` também persiste o campo pra quem está editando metadados.
 */
export async function toggleBookFavorite(
  id: string,
): Promise<ActionResult<{ is_favorite: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: existing, error: fetchErr } = await supabase
    .from("book")
    .select("id, slug, is_favorite")
    .eq("id", id)
    .single();
  if (fetchErr || !existing)
    return { ok: false, message: "Livro não encontrado." };

  const next = !existing.is_favorite;
  const { error } = await supabase
    .from("book")
    .update({ is_favorite: next })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/book");
  revalidatePath(`/book/${existing.slug}`);
  return { ok: true, data: { is_favorite: next } };
}
