"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export type ReadingCapacityInput = {
  /** Presente = edição; ausente = criação. */
  id?: string;
  start_date: string;
  end_date: string;
  pages_per_day: number;
};

/**
 * Cria/edita um período de capacidade ("leio X páginas/dia entre DD e DD").
 * Períodos podem se sobrepor de propósito: o MAIS ESTREITO que cobre o dia
 * vence (ex.: mês inteiro a 100/dia + semana de folga a 150/dia).
 */
export async function upsertReadingCapacity(
  input: ReadingCapacityInput,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const pages = Math.floor(input.pages_per_day);
  if (!Number.isFinite(pages) || pages <= 0) {
    return {
      ok: false,
      message: "Informe quantas páginas por dia.",
      field: "pages_per_day",
    };
  }
  if (!input.start_date || !input.end_date || input.end_date < input.start_date) {
    return {
      ok: false,
      message: "Período inválido — o fim deve ser depois do início.",
      field: "end_date",
    };
  }

  if (input.id) {
    const { error } = await supabase
      .from("reading_capacity")
      .update({
        start_date: input.start_date,
        end_date: input.end_date,
        pages_per_day: pages,
      })
      .eq("id", input.id)
      .eq("user_id", user.id);
    if (error) return { ok: false, ...translateSupabaseError(error) };
    revalidatePath("/plano");
    return { ok: true, data: { id: input.id } };
  }

  const { data, error } = await supabase
    .from("reading_capacity")
    .insert({
      user_id: user.id,
      start_date: input.start_date,
      end_date: input.end_date,
      pages_per_day: pages,
    })
    .select("id")
    .single();
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: { id: data.id } };
}
