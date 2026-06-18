"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Remove a anotação de um registro do `reading_progress_log` setando
 * `notes = null`. O registro continua existindo pra preservar o `pages_delta`
 * do dia (importante pra stats/heatmap). Se o registro tem 0 páginas e a
 * nota era a única razão dele existir, ele fica "vazio" mas é inofensivo.
 */
export async function removeReadingProgressNote(
  logId: string,
  bookSlug?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  if (!logId) return { ok: false, message: "Anotação inválida." };

  const { error } = await supabase
    .from("reading_progress_log")
    .update({ notes: null })
    .eq("id", logId)
    .eq("user_id", user.id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (bookSlug) revalidatePath(`/book/${bookSlug}`);
  return { ok: true };
}
