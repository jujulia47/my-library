"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Define o PLANEJADO de um livro num dia específico (item 3 — o planejamento
 * que você organiza e ajusta). Grava em reading_plan_day_override.
 *
 * - Garante que exista a linha reading_plan_book do mês (cria vazia se preciso,
 *   pra o override ter onde se ancorar — o livro passa a "existir no plano"
 *   mesmo sem ritmo base).
 * - `pages = null` remove o override daquele dia (volta pro ritmo uniforme, se
 *   houver).
 */
export async function setPlanDayOverride(input: {
  year: number;
  month: number;
  book_id: string;
  day: string;
  pages: number | null;
}): Promise<ActionResult<{ plan_book_id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { year, month, book_id, day } = input;
  if (!book_id || !day) return { ok: false, message: "Dados inválidos." };

  // Garante a linha do plano do mês.
  const { data: existing } = await supabase
    .from("reading_plan_book")
    .select("id")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .eq("book_id", book_id)
    .maybeSingle();

  let planBookId = existing?.id ?? null;
  if (!planBookId) {
    const { data: created, error: createErr } = await supabase
      .from("reading_plan_book")
      .insert({ user_id: user.id, year, month, book_id })
      .select("id")
      .single();
    if (createErr) return { ok: false, ...translateSupabaseError(createErr) };
    planBookId = created.id;
  }

  if (input.pages === null || input.pages < 0) {
    await supabase
      .from("reading_plan_day_override")
      .delete()
      .eq("plan_book_id", planBookId)
      .eq("day", day);
  } else {
    const { error } = await supabase
      .from("reading_plan_day_override")
      .upsert(
        {
          user_id: user.id,
          plan_book_id: planBookId,
          day,
          pages: Math.floor(input.pages),
        },
        { onConflict: "plan_book_id,day" },
      );
    if (error) return { ok: false, ...translateSupabaseError(error) };
  }

  revalidatePath("/plano");
  return { ok: true, data: { plan_book_id: planBookId } };
}
