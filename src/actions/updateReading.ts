"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import {
  createReadingEvent,
  eventTypeForTransition,
  todayISO,
} from "@/utils/readingEvents";
import { maybeCompleteChallengesForBook } from "@/services/challengeCompletion";
import type { Database } from "@/utils/typings/supabase";

type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type BookFormat = Database["public"]["Enums"]["book_format"];

const readingStatuses: ReadingStatus[] = [
  "reading",
  "paused",
  "finished",
  "abandoned",
];
const formats: BookFormat[] = ["physical", "ebook", "audiobook"];

function pick<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : null;
}

export async function updateReading(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "Leitura inválida." };

  const status = pick(formData.get("status"), readingStatuses);
  if (!status) return { ok: false, message: "Status inválido." };

  const format = pick(formData.get("format"), formats);
  const start_date = (formData.get("start_date") as string) || null;
  const finish_date = (formData.get("finish_date") as string) || null;
  const currentPageRaw = formData.get("current_page") as string | null;
  const current_page =
    currentPageRaw && currentPageRaw !== "" ? Number(currentPageRaw) || null : null;
  const ratingRaw = formData.get("rating") as string | null;
  const rating = ratingRaw && ratingRaw !== "" ? Number(ratingRaw) || null : null;
  const review = (formData.get("review") as string)?.trim() || null;

  // Lê estado anterior pra decidir se há transição (status) e pra calcular
  // delta de páginas (current_page) — registrado em reading_progress_log.
  // book_id é necessário pra acionar o gatilho de completed_at em challenges.
  const { data: existing } = await supabase
    .from("reading")
    .select("status, current_page, book_id")
    .eq("id", id)
    .maybeSingle();
  const previousStatus = (existing?.status as ReadingStatus | undefined) ?? null;
  const previousPage = existing?.current_page ?? null;
  const bookIdForReading = existing?.book_id ?? null;

  const { error } = await supabase
    .from("reading")
    .update({
      status,
      format,
      start_date,
      finish_date: status === "reading" ? null : finish_date,
      current_page:
        status === "reading" || status === "paused" ? current_page : null,
      rating: status === "finished" ? rating : null,
      review:
        status === "finished" || status === "abandoned" ? review : null,
    })
    .eq("id", id);

  if (error) return { ok: false, ...translateSupabaseError(error) };

  // Reading progress log — registra delta de páginas lidas pra alimentar a
  // home dashboard ("páginas lidas hoje", streak etc.). Só registra deltas
  // positivos (correções pra menos não contam como progresso). Upsert com
  // onConflict (reading_id, log_date) soma se já houver log do mesmo dia.
  if (
    typeof current_page === "number" &&
    (status === "reading" || status === "paused")
  ) {
    const prev = typeof previousPage === "number" ? previousPage : 0;
    const delta = current_page - prev;
    if (delta > 0) {
      const today = todayISO();
      // Lê o log existente pra somar manualmente (upsert do PostgREST não
      // suporta `pages_delta = pages_delta + N` direto).
      const { data: existingLog } = await supabase
        .from("reading_progress_log")
        .select("pages_delta")
        .eq("reading_id", id)
        .eq("log_date", today)
        .maybeSingle();
      const finalDelta = (existingLog?.pages_delta ?? 0) + delta;
      await supabase
        .from("reading_progress_log")
        .upsert(
          {
            user_id: user.id,
            reading_id: id,
            log_date: today,
            pages_delta: finalDelta,
          },
          { onConflict: "reading_id,log_date" },
        );
    }
  }

  // Emite event apenas se houve mudança de status.
  if (previousStatus && previousStatus !== status) {
    const eventType = eventTypeForTransition(previousStatus, status);
    if (eventType) {
      // Data do evento: pra finished/abandoned usa finish_date (a data que o
      // usuário escolheu pro fim); pra demais transições, hoje. start_date
      // não é usado aqui — esse campo na reading representa o "início desde
      // sempre", não a data desta transição específica.
      const eventDate =
        (status === "finished" || status === "abandoned"
          ? finish_date
          : null) ?? todayISO();
      const evResult = await createReadingEvent(supabase, {
        user_id: user.id,
        reading_id: id,
        event_type: eventType,
        event_date: eventDate,
      });
      if (!evResult.ok) {
        // Não dá pra fazer rollback do update sem snapshot do estado anterior.
        // Reportamos o erro do event; reading.status já foi atualizado mas
        // sem o event correspondente. O usuário vê a mensagem e pode editar
        // de novo. (Decisão: aceitar essa janela em vez de complicar com
        // snapshot/transação manual.)
        return evResult;
      }
    }
  }

  // Sessão 15.1: se a reading virou `finished` agora (transição), checa se
  // algum challenge contendo o livro atingiu a meta. Idempotente.
  if (
    status === "finished" &&
    previousStatus !== "finished" &&
    bookIdForReading
  ) {
    await maybeCompleteChallengesForBook(supabase, user.id, bookIdForReading);
  }

  const slug = formData.get("book_slug") as string | null;
  if (slug) revalidatePath(`/book/${slug}`);
  revalidatePath("/book");
  revalidatePath("/collection");
  return { ok: true };
}
