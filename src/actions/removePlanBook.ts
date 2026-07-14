"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Remove um livro do plano do mês (apaga a linha de agendamento e, via cascade,
 * os overrides por dia). Também remove de Próximas leituras (home_next_read) —
 * as duas listas andam juntas: sem isso o livro seria re-semeado e voltaria ao
 * plano no próximo carregamento.
 */
export async function removePlanBook(
  year: number,
  month: number,
  bookId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { error } = await supabase
    .from("reading_plan_book")
    .delete()
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .eq("book_id", bookId);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  // Sai também de Próximas leituras (mesma lista).
  await supabase
    .from("home_next_read")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);

  revalidatePath("/plano");
  revalidatePath("/");
  return { ok: true, data: null };
}
