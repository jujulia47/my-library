"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { currentMonthISO, normalizeMonthParam } from "@/utils/dates";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Remove um livro do plano de um MÊS. Recebe o BOOK_ID (não o id da linha) +
 * o mês; deleta a entrada `home_next_read` daquele livro naquele mês.
 *
 * NÃO altera o status de leitura — um livro "Lendo" sai do plano e continua
 * "Lendo" (aparece em "Hoje na sua mesa", nunca em Próximas leituras).
 */
export async function removeHomeNextRead(
  bookId: string,
  monthISO?: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const planMonth = normalizeMonthParam(monthISO ?? null) ?? currentMonthISO();

  const { error } = await supabase
    .from("home_next_read")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .eq("plan_month", planMonth);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/");
  revalidatePath("/plano");
  return { ok: true, data: null };
}
