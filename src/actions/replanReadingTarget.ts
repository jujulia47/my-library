"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/utils/dates";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Recalcula uma meta ATRASADA: redistribui o que falta (da página atual até
 * page_to) entre hoje e o prazo. É a única forma da cota diária subir — sem
 * esse clique, o plano nunca se reajusta sozinho pra cima.
 *
 * `reset = true` desfaz, voltando ao cronograma original.
 */
export async function replanReadingTarget(
  id: string,
  reset: boolean = false,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  if (reset) {
    const { error } = await supabase
      .from("reading_target")
      .update({ replan_from_date: null, replan_from_page: null })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, ...translateSupabaseError(error) };
    revalidatePath("/plano");
    return { ok: true, data: null };
  }

  const { data: target, error: fetchErr } = await supabase
    .from("reading_target")
    .select("id, book_id, start_date, end_date, page_from, page_to")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (fetchErr || !target) {
    return { ok: false, message: "Meta não encontrada." };
  }

  const today = todayISO();
  if (today > target.end_date) {
    return {
      ok: false,
      message:
        "A meta já venceu — use \"jogar na meta seguinte\" pra transferir o que faltou.",
    };
  }

  const { data: readings } = await supabase
    .from("reading")
    .select("id, current_page")
    .eq("user_id", user.id)
    .eq("book_id", target.book_id);
  const currentPage = (readings ?? []).reduce(
    (max, r) => Math.max(max, r.current_page ?? 0),
    0,
  );

  // A base é a página do INÍCIO de hoje — o que já foi lido hoje conta como
  // parte da cota de hoje, não como marco. Gravar a página atual (com as
  // páginas de hoje dentro) criava um "atraso" igual ao que você acabou de
  // ler.
  let readToday = 0;
  const readingIds = (readings ?? []).map((r) => r.id);
  if (readingIds.length > 0) {
    const { data: logs } = await supabase
      .from("reading_progress_log")
      .select("pages_delta")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .in("reading_id", readingIds);
    readToday = (logs ?? []).reduce(
      (sum, l) => sum + Math.max(0, l.pages_delta),
      0,
    );
  }

  // Nunca recua antes do início da meta.
  const fromPage = Math.max(currentPage - readToday, target.page_from - 1);
  const fromDate = today > target.start_date ? today : target.start_date;

  const { error } = await supabase
    .from("reading_target")
    .update({ replan_from_date: fromDate, replan_from_page: fromPage })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: null };
}
