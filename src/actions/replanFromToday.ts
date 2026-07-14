"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/utils/readingEvents";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * "Re-planejar a partir de hoje" — reancora o plano do mês: define
 * `start_date = hoje` pros livros cujo início já passou. Como o saldo é sempre
 * medido contra o plano atual, isso zera o déficit acumulado e redistribui as
 * páginas que faltam pelos dias restantes (mantendo o ritmo/fim de cada livro).
 */
export async function replanFromToday(
  year: number,
  month: number,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const today = todayISO();

  // Só faz sentido no mês corrente. Busca as linhas com início no passado.
  const { data: rows } = await supabase
    .from("reading_plan_book")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month);

  const toUpdate = (rows ?? []).filter(
    (r) => r.start_date && r.start_date < today,
  );
  if (toUpdate.length === 0) return { ok: true, data: null };

  for (const r of toUpdate) {
    // Se a data fim ficou no passado, limpa (inválida) — cai pro ritmo.
    const clearEnd = r.end_date && r.end_date < today;
    const { error } = await supabase
      .from("reading_plan_book")
      .update({
        start_date: today,
        ...(clearEnd ? { end_date: null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);
    if (error) return { ok: false, ...translateSupabaseError(error) };
  }

  revalidatePath("/plano");
  return { ok: true, data: null };
}
