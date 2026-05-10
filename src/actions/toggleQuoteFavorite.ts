"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Inverte `is_favorite` da citação. Estrela ⭐ gold no QuoteCard / detail.
 */
export async function toggleQuoteFavorite(
  id: string,
): Promise<ActionResult<{ is_favorite: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: existing, error: fetchErr } = await supabase
    .from("quote")
    .select("id, slug, is_favorite")
    .eq("id", id)
    .single();
  if (fetchErr || !existing)
    return { ok: false, message: "Citação não encontrada." };

  const next = !existing.is_favorite;
  const { error } = await supabase
    .from("quote")
    .update({ is_favorite: next })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/quote");
  revalidatePath(`/quote/${existing.slug}`);
  return { ok: true, data: { is_favorite: next } };
}
