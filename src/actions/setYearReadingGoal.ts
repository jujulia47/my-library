"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Salva (upsert) a meta de livros lidos do usuário pra um ano específico.
 * Usado pelo grid "Livros lidos em YYYY" — clique em "meta: N" abre edição
 * inline e essa action persiste o número escolhido.
 */
export async function setYearReadingGoal(
  year: number,
  goalCount: number,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return { ok: false, message: "Ano inválido." };
  }
  if (!Number.isInteger(goalCount) || goalCount < 1 || goalCount > 1000) {
    return {
      ok: false,
      message: "Meta deve ser um número inteiro entre 1 e 1000.",
      field: "goal_count",
    };
  }

  const { error } = await supabase.from("reading_goal").upsert(
    {
      user_id: user.id,
      year,
      goal_count: goalCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,year" },
  );
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath(`/year/${year}`);
  return { ok: true };
}
