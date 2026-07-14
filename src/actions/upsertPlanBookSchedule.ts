"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export type PlanScheduleInput = {
  year: number;
  month: number;
  book_id: string;
  start_date: string | null;
  /** Modo de agendamento: informa páginas/dia OU data final (o outro é null). */
  pages_per_day: number | null;
  end_date: string | null;
  /** Páginas a ler só neste mês (opcional). undefined = não mexe no campo. */
  pages_this_month?: number | null;
};

/**
 * Cria/atualiza o agendamento de um livro no plano de um mês.
 *
 * Regra "dois de três": guardamos `start_date` + UM entre `pages_per_day` e
 * `end_date`. Ao setar páginas/dia, zeramos end_date (e vice-versa) — o valor
 * faltante é derivado em memória por `deriveSchedule`.
 */
export async function upsertPlanBookSchedule(
  input: PlanScheduleInput,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { year, month, book_id } = input;
  if (!book_id) return { ok: false, message: "Livro inválido." };

  // Normaliza: só um dos dois modos sobrevive.
  const pages_per_day =
    input.pages_per_day && input.pages_per_day > 0 ? input.pages_per_day : null;
  const end_date = pages_per_day ? null : input.end_date || null;
  const start_date = input.start_date || null;

  const base = {
    user_id: user.id,
    year,
    month,
    book_id,
    start_date,
    pages_per_day,
    end_date,
    updated_at: new Date().toISOString(),
  };
  // Só mexe no campo do mês quando explicitamente informado (undefined preserva).
  const payload =
    input.pages_this_month !== undefined
      ? {
          ...base,
          pages_this_month:
            input.pages_this_month && input.pages_this_month > 0
              ? input.pages_this_month
              : null,
        }
      : base;

  const { data, error } = await supabase
    .from("reading_plan_book")
    .upsert(payload, { onConflict: "user_id,year,month,book_id" })
    .select("id")
    .single();
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: { id: data.id } };
}
