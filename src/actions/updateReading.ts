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

  // Emite event apenas se houve mudança de status. Pra finished/abandoned
  // só cria event se o user forneceu finish_date (não inventa "hoje"). Pra
  // demais transições (pausar/retomar), "hoje" faz sentido como momento da
  // ação. start_date NÃO é usado aqui — representa o "início desde sempre"
  // da reading, sincronizado abaixo via sync de events.
  if (previousStatus && previousStatus !== status) {
    const eventType = eventTypeForTransition(previousStatus, status);
    if (eventType) {
      const isClosing = status === "finished" || status === "abandoned";
      const eventDate = isClosing ? finish_date : todayISO();
      if (eventDate) {
        const evResult = await createReadingEvent(supabase, {
          user_id: user.id,
          reading_id: id,
          event_type: eventType,
          event_date: eventDate,
        });
        if (!evResult.ok) {
          // Não dá pra fazer rollback do update sem snapshot do estado anterior.
          // Reportamos o erro do event; reading.status já foi atualizado mas
          // sem o event correspondente. O user vê a mensagem e pode editar
          // de novo. (Decisão: aceitar essa janela em vez de complicar com
          // snapshot/transação manual.)
          return evResult;
        }
      }
    }
  }

  // Sync de start_date com o event "started" mais antigo. Cobre dois casos:
  //  1) Bug antigo: events foram criados com "hoje" porque o user não tinha
  //     fornecido data. Agora ele edita e informa a real → atualizamos.
  //  2) User só editou a data (sem mudar status) → o event precisa refletir.
  // Se há múltiplos started events (re-opens), sincroniza só o primeiro —
  // os demais são re-aberturas legítimas que não devem ser mexidas.
  {
    const { data: startedEvents } = await supabase
      .from("reading_event")
      .select("id, event_date")
      .eq("reading_id", id)
      .eq("event_type", "started")
      .order("event_date", { ascending: true });

    if (start_date) {
      if (!startedEvents || startedEvents.length === 0) {
        await createReadingEvent(supabase, {
          user_id: user.id,
          reading_id: id,
          event_type: "started",
          event_date: start_date,
        });
      } else if (startedEvents[0].event_date !== start_date) {
        await supabase
          .from("reading_event")
          .update({ event_date: start_date })
          .eq("id", startedEvents[0].id);
      }
    } else if (startedEvents && startedEvents.length === 1) {
      // User limpou a data e só há um started event — deleta pra remover
      // a data fake. Se houver múltiplos, não tocamos (são re-opens reais).
      await supabase
        .from("reading_event")
        .delete()
        .eq("id", startedEvents[0].id);
    }
  }

  // Sync de finish_date com o event de fechamento (finished/abandoned) mais
  // recente quando o status atual é fechado. Mesma lógica do started: se
  // há vários (re-fechamentos), só sincroniza o mais recente.
  if (status === "finished" || status === "abandoned") {
    const closingType: Database["public"]["Enums"]["reading_event_type"] =
      status === "finished" ? "finished" : "abandoned";
    const { data: closingEvents } = await supabase
      .from("reading_event")
      .select("id, event_date")
      .eq("reading_id", id)
      .eq("event_type", closingType)
      .order("event_date", { ascending: false });

    if (finish_date) {
      if (!closingEvents || closingEvents.length === 0) {
        await createReadingEvent(supabase, {
          user_id: user.id,
          reading_id: id,
          event_type: closingType,
          event_date: finish_date,
        });
      } else if (closingEvents[0].event_date !== finish_date) {
        await supabase
          .from("reading_event")
          .update({ event_date: finish_date })
          .eq("id", closingEvents[0].id);
      }
    } else if (closingEvents && closingEvents.length === 1) {
      await supabase
        .from("reading_event")
        .delete()
        .eq("id", closingEvents[0].id);
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
