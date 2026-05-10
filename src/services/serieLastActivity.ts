import type { Database } from "@/utils/typings/supabase";

export type ReadingEventType =
  Database["public"]["Enums"]["reading_event_type"];

export type LastActivityEvent = {
  event_type: ReadingEventType;
  created_at: string;
};

export type LastActivityReading = {
  updated_at: string;
  events: LastActivityEvent[];
};

export type LastActivityBook = {
  title: string;
  slug: string;
  readings: LastActivityReading[];
};

export type LastActivity =
  | {
      type: "event";
      event_type: ReadingEventType;
      book_title: string;
      book_slug: string;
      /** ISO timestamp da reading.updated_at (não do event_date). */
      date: string;
    }
  | {
      type: "update";
      book_title: string;
      book_slug: string;
      date: string;
    };

/** Janela de tolerância (em ms) entre `reading.updated_at` e `event.created_at`
 *  pra considerar que a updated foi causada por um evento (e não um update
 *  de campo isolado tipo current_page ou rating). */
const EVENT_WINDOW_MS = 60_000;

/**
 * Detecta a "última atividade" de uma série a partir das readings dos seus
 * livros e respectivos events.
 *
 * Estratégia:
 * 1. Pega a reading com MAX(updated_at) entre todas as da série.
 * 2. Pega o event mais recente (por created_at) DESSA reading.
 * 3. Se reading.updated_at fica dentro de `EVENT_WINDOW_MS` do event, foi a
 *    transição que causou o update — type: 'event' com event_type.
 * 4. Senão, foi edição de campo (current_page/rating/review/...) sem
 *    transição — type: 'update'.
 *
 * Retorna null se a série não tem nenhuma reading.
 */
export function deriveLastActivity(
  books: LastActivityBook[],
): LastActivity | null {
  let best: {
    reading: LastActivityReading;
    book: LastActivityBook;
  } | null = null;

  for (const book of books) {
    for (const reading of book.readings) {
      if (!reading.updated_at) continue;
      if (
        !best ||
        reading.updated_at > best.reading.updated_at
      ) {
        best = { reading, book };
      }
    }
  }

  if (!best) return null;

  // Procura o event mais recente da reading (por created_at).
  const sortedEvents = [...best.reading.events].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const lastEvent = sortedEvents[0] ?? null;

  if (lastEvent) {
    const updatedMs = Date.parse(best.reading.updated_at);
    const eventMs = Date.parse(lastEvent.created_at);
    if (
      Number.isFinite(updatedMs) &&
      Number.isFinite(eventMs) &&
      Math.abs(updatedMs - eventMs) <= EVENT_WINDOW_MS
    ) {
      return {
        type: "event",
        event_type: lastEvent.event_type,
        book_title: best.book.title,
        book_slug: best.book.slug,
        date: best.reading.updated_at,
      };
    }
  }

  return {
    type: "update",
    book_title: best.book.title,
    book_slug: best.book.slug,
    date: best.reading.updated_at,
  };
}

/**
 * Texto legível pra UI da última atividade. Apenas verbo + título — caller
 * adiciona "há X" como sub-linha.
 */
export function lastActivityVerb(activity: LastActivity): string {
  if (activity.type === "update") return "Atualizou progresso de";
  switch (activity.event_type) {
    case "started":
      return "Começou";
    case "paused":
      return "Pausou";
    case "resumed":
      return "Retomou";
    case "finished":
      return "Concluiu";
    case "abandoned":
      return "Abandonou";
  }
}
