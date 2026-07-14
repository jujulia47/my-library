"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createReadingEvent, todayISO } from "@/utils/readingEvents";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Registro rápido de leitura de um livro num dia específico, a partir da página
 * do plano. Semântica "set": define o total de páginas lidas DAQUELE livro
 * NAQUELE dia (não soma). Ajusta `reading.current_page` pela diferença líquida.
 *
 * - Reaproveita `reading_progress_log` (mesma tabela do botão Atualizar), então
 *   o registro aparece no diário/plano igual.
 * - Se o livro ainda não tem leitura ativa, cria uma (status reading) — logar
 *   leitura implica que você começou.
 */
export async function logPlanDayReading(input: {
  book_id: string;
  book_slug?: string | null;
  log_date: string;
  /** Total de páginas lidas do livro nesse dia (0 = limpa o registro). */
  pages: number;
}): Promise<ActionResult<{ reading_id: string; current_page: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { book_id } = input;
  if (!book_id) return { ok: false, message: "Livro inválido." };

  const today = todayISO();
  const logDate = (input.log_date || today).slice(0, 10);
  if (logDate > today) {
    return { ok: false, message: "Data não pode ser no futuro." };
  }
  const pages = Math.max(0, Math.floor(input.pages));

  // Resolve leitura ativa (reading/paused) mais recente; senão cria.
  const { data: readings } = await supabase
    .from("reading")
    .select("id, current_page, status")
    .eq("user_id", user.id)
    .eq("book_id", book_id)
    .in("status", ["reading", "paused"])
    .order("updated_at", { ascending: false });

  let readingId = readings?.[0]?.id ?? null;
  let prevCurrent = readings?.[0]?.current_page ?? 0;

  if (!readingId) {
    const { data: created, error: createErr } = await supabase
      .from("reading")
      .insert({
        user_id: user.id,
        book_id,
        status: "reading",
        start_date: logDate,
        current_page: 0,
      })
      .select("id")
      .single();
    if (createErr) return { ok: false, ...translateSupabaseError(createErr) };
    readingId = created.id;
    prevCurrent = 0;
    await createReadingEvent(supabase, {
      user_id: user.id,
      reading_id: readingId,
      event_type: "started",
      event_date: logDate,
    });
  }

  // Delta antigo desse dia (constraint única reading_id+log_date).
  const { data: existingLog } = await supabase
    .from("reading_progress_log")
    .select("pages_delta")
    .eq("reading_id", readingId)
    .eq("log_date", logDate)
    .maybeSingle();
  const oldDelta = existingLog?.pages_delta ?? 0;

  const netDelta = pages - oldDelta;
  const newCurrent = Math.max(0, prevCurrent + netDelta);

  const { error: upErr } = await supabase
    .from("reading")
    .update({ current_page: newCurrent })
    .eq("id", readingId);
  if (upErr) return { ok: false, ...translateSupabaseError(upErr) };

  if (pages <= 0) {
    // Limpa o registro do dia.
    await supabase
      .from("reading_progress_log")
      .delete()
      .eq("reading_id", readingId)
      .eq("log_date", logDate);
  } else {
    const { error: logErr } = await supabase
      .from("reading_progress_log")
      .upsert(
        {
          user_id: user.id,
          reading_id: readingId,
          log_date: logDate,
          pages_delta: pages,
        },
        { onConflict: "reading_id,log_date" },
      );
    if (logErr) return { ok: false, ...translateSupabaseError(logErr) };
  }

  revalidatePath("/plano");
  revalidatePath("/");
  if (input.book_slug) revalidatePath(`/book/${input.book_slug}`);
  return { ok: true, data: { reading_id: readingId, current_page: newCurrent } };
}
