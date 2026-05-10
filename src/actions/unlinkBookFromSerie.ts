"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Desvincula um livro de uma série. Não destrói o livro — apenas zera
 * `serie_id` e `volume`. O livro continua existindo na biblioteca, sem
 * série atribuída. Reversível via form de edição do livro.
 */
export async function unlinkBookFromSerie(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const book_id = (formData.get("book_id") as string)?.trim();
  if (!book_id) return { ok: false, message: "Livro inválido." };

  // Confirma que o livro pertence ao usuário.
  const { data: book } = await supabase
    .from("book")
    .select("id, slug, serie_id, user_id")
    .eq("id", book_id)
    .maybeSingle();
  if (!book || book.user_id !== user.id) {
    return { ok: false, message: "Livro não encontrado." };
  }

  const { error } = await supabase
    .from("book")
    .update({ serie_id: null, volume: null })
    .eq("id", book_id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  // Revalida caches: a série de origem (passada via formData) e o detail
  // do livro.
  const serieSlug = formData.get("serie_slug") as string | null;
  if (serieSlug) revalidatePath(`/serie/${serieSlug}`);
  revalidatePath("/serie");
  revalidatePath(`/book/${book.slug}`);
  revalidatePath("/book");
  return { ok: true };
}
