"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  currentMonthISO,
  normalizeMonthParam,
  todayISO,
} from "@/utils/dates";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Define (ou remove) a diluição do atraso do mês: espalha o déficit de
 * capacidade até `spreadUntil`. `spreadUntil = null` desfaz a diluição.
 */
export async function setPlanCatchup(
  monthISO: string | undefined,
  spreadUntil: string | null,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const planMonth = normalizeMonthParam(monthISO ?? null) ?? currentMonthISO();

  if (spreadUntil === null) {
    const { error } = await supabase
      .from("reading_plan_catchup")
      .delete()
      .eq("user_id", user.id)
      .eq("plan_month", planMonth);
    if (error) return { ok: false, ...translateSupabaseError(error) };
    revalidatePath("/plano");
    return { ok: true, data: null };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(spreadUntil) || spreadUntil < todayISO()) {
    return { ok: false, message: "Escolha uma data a partir de hoje." };
  }

  const { error } = await supabase
    .from("reading_plan_catchup")
    .upsert(
      {
        user_id: user.id,
        plan_month: planMonth,
        spread_until: spreadUntil,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,plan_month" },
    );
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: null };
}
