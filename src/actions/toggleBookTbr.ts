"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Inverte `is_tbr` do livro — marca/desmarca o livro na lista "quero ler".
 * Independente do histórico de leitura: serve tanto pra livro novo quanto
 * pra um já lido que se quer reler. Mesmo pattern de `toggleBookFavorite`.
 */
export async function toggleBookTbr(
  id: string,
): Promise<ActionResult<{ is_tbr: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: existing, error: fetchErr } = await supabase
    .from("book")
    .select("id, slug, is_tbr")
    .eq("id", id)
    .single();
  if (fetchErr || !existing)
    return { ok: false, message: "Livro não encontrado." };

  const next = !existing.is_tbr;
  const { error } = await supabase
    .from("book")
    .update({ is_tbr: next })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/book");
  revalidatePath(`/book/${existing.slug}`);
  return { ok: true, data: { is_tbr: next } };
}
