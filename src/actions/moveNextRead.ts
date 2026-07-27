"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { currentMonthISO, normalizeMonthParam } from "@/utils/dates";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Move um livro pra cima/baixo na fila de leitura de um MÊS
 * (home_next_read.position dentro de plan_month).
 *
 * Renumera as posições em sequência (0..n-1) pra manter a ordem limpa mesmo
 * com gaps históricos.
 */
export async function moveNextRead(
  bookId: string,
  direction: "up" | "down",
  monthISO?: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const planMonth = normalizeMonthParam(monthISO ?? null) ?? currentMonthISO();

  const { data: rows, error: fetchErr } = await supabase
    .from("home_next_read")
    .select("id, book_id, position")
    .eq("user_id", user.id)
    .eq("plan_month", planMonth)
    .order("position", { ascending: true });
  if (fetchErr) return { ok: false, ...translateSupabaseError(fetchErr) };

  const list = rows ?? [];
  const idx = list.findIndex((r) => r.book_id === bookId);
  if (idx === -1) return { ok: false, message: "Livro não está na fila." };

  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= list.length) return { ok: true, data: null };

  // Troca e renumera tudo em sequência.
  [list[idx], list[target]] = [list[target], list[idx]];
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].position !== i) {
      const { error } = await supabase
        .from("home_next_read")
        .update({ position: i })
        .eq("id", list[i].id);
      if (error) return { ok: false, ...translateSupabaseError(error) };
    }
  }

  revalidatePath("/plano");
  revalidatePath("/");
  return { ok: true, data: null };
}
