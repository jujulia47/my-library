"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Planejamento por semana: distribui `pages` páginas de um livro pelos dias da
 * semana (`days`), gravando um override por dia. Distribuição uniforme com o
 * resto nos primeiros dias. `pages = 0` limpa os overrides da semana.
 *
 * Cria a linha reading_plan_book do mês se ainda não existir (pra o override
 * ter onde se ancorar).
 */
export async function setPlanWeekPages(input: {
  year: number;
  month: number;
  book_id: string;
  days: string[];
  pages: number;
}): Promise<ActionResult<{ plan_book_id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { year, month, book_id, days } = input;
  if (!book_id || days.length === 0)
    return { ok: false, message: "Dados inválidos." };

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

  const pages = Math.max(0, Math.floor(input.pages));

  if (pages <= 0) {
    // Limpa a semana.
    await supabase
      .from("reading_plan_day_override")
      .delete()
      .eq("plan_book_id", planBookId)
      .in("day", days);
    revalidatePath("/plano");
    return { ok: true, data: { plan_book_id: planBookId } };
  }

  // Distribuição uniforme: base por dia + resto nos primeiros dias.
  const n = days.length;
  const base = Math.floor(pages / n);
  let remainder = pages - base * n;
  const rows = days.map((day) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return {
      user_id: user.id,
      plan_book_id: planBookId,
      day,
      pages: base + extra,
    };
  });

  const { error } = await supabase
    .from("reading_plan_day_override")
    .upsert(rows, { onConflict: "plan_book_id,day" });
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: { plan_book_id: planBookId } };
}
