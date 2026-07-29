"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { currentMonthISO, normalizeMonthParam } from "@/utils/dates";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Define quantas páginas de um livro de fila (sem meta) você vai ler NESTE
 * mês. `pages = null` volta ao default (o livro todo). Grava em
 * home_next_read.pages_planned da entrada daquele mês.
 */
export async function setPlanBookPages(
  bookId: string,
  monthISO: string | undefined,
  pages: number | null,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const planMonth = normalizeMonthParam(monthISO ?? null) ?? currentMonthISO();

  let value: number | null = null;
  if (pages !== null) {
    const n = Math.floor(pages);
    if (!Number.isFinite(n) || n <= 0) {
      return { ok: false, message: "Informe um número de páginas maior que 0." };
    }
    value = n;
  }

  const { error } = await supabase
    .from("home_next_read")
    .update({ pages_planned: value })
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .eq("plan_month", planMonth);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: null };
}
