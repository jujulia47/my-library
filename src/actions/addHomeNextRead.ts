"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { currentMonthISO, normalizeMonthParam } from "@/utils/dates";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Adiciona um livro ao plano de leitura de um MÊS (default: mês atual).
 *
 * - `plan_month` = 1º dia do mês. Um livro pode estar em meses diferentes.
 * - `position = (max do mês + 1)` pra colocar no fim da fila daquele mês.
 * - unique (user_id, book_id, plan_month) impede duplicar; se já existe no
 *   mês, retorna sucesso silencioso (idempotente).
 * - NÃO toca no status de leitura do livro.
 */
export async function addHomeNextRead(
  bookId: string,
  monthISO?: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const planMonth = normalizeMonthParam(monthISO ?? null) ?? currentMonthISO();

  const { data: existing } = await supabase
    .from("home_next_read")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .eq("plan_month", planMonth)
    .maybeSingle();
  if (existing) {
    return { ok: true, data: { id: existing.id } };
  }

  const { data: maxRow } = await supabase
    .from("home_next_read")
    .select("position")
    .eq("user_id", user.id)
    .eq("plan_month", planMonth)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("home_next_read")
    .insert({
      user_id: user.id,
      book_id: bookId,
      plan_month: planMonth,
      position: nextPosition,
    })
    .select("id")
    .single();
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/");
  revalidatePath("/plano");
  return { ok: true, data: { id: data.id } };
}
