"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/utils/dates";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * "Replanejar" uma meta vencida: joga o restante dela na meta SEGUINTE do
 * mesmo livro (só na seguinte — a matemática em deriveBookTargets garante que
 * nada conta duplicado). Com carried=false, desfaz.
 */
export async function carryOverReadingTarget(
  id: string,
  carried: boolean = true,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: target, error: fetchErr } = await supabase
    .from("reading_target")
    .select("id, book_id, end_date, page_to")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (fetchErr || !target) {
    return { ok: false, message: "Meta não encontrada." };
  }

  if (carried) {
    if (target.end_date >= todayISO()) {
      return {
        ok: false,
        message: "Só é possível replanejar uma meta já vencida.",
      };
    }

    // Precisa existir uma meta seguinte pra receber o restante.
    const { data: next, error: nextErr } = await supabase
      .from("reading_target")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", target.book_id)
      .gt("page_from", target.page_to)
      .limit(1);
    if (nextErr) return { ok: false, ...translateSupabaseError(nextErr) };
    if (!next || next.length === 0) {
      return {
        ok: false,
        message:
          "Não há meta seguinte pra receber o restante — crie uma nova meta primeiro.",
      };
    }
  }

  const { error } = await supabase
    .from("reading_target")
    .update({ carried_over: carried })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: null };
}
