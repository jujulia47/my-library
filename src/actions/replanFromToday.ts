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

  // Re-planeja todo livro AGENDADO (tem ritmo ou data fim) do mês pra começar
  // hoje — redistribui o que falta pelos dias restantes. Livros sem ritmo não
  // têm o que redistribuir.
  const { data: rows } = await supabase
    .from("reading_plan_book")
    .select("id, start_date, end_date, pages_per_day")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month);

  const scheduled = (rows ?? []).filter(
    (r) => r.pages_per_day != null || r.end_date != null,
  );
  if (scheduled.length === 0) return { ok: true, data: null };

  for (const r of scheduled) {
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
