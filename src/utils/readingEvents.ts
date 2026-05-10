import type { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export type ReadingEventType =
  Database["public"]["Enums"]["reading_event_type"];

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Hoje em ISO `YYYY-MM-DD` (UTC). Igual ao que vem de `<input type="date">`
 * em PT-BR. Não usa `toISOString` porque ele dá hora também.
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Insere um event no histórico de uma reading. Inputs típicos vêm de actions
 * de transição (pause/resume/finish/abandon/start). Centraliza:
 *   1) Garantia de `user_id` no insert (RLS exige).
 *   2) Validação de formato da data (constraint do banco já bloqueia >= hoje,
 *      mas validar aqui dá mensagem melhor pro usuário).
 *
 * Retorna `ActionResult` — caller pode propagar pra UI direto.
 */
export async function createReadingEvent(
  supabase: SupabaseServerClient,
  params: {
    user_id: string;
    reading_id: string;
    event_type: ReadingEventType;
    event_date: string;
    notes?: string | null;
  },
): Promise<ActionResult> {
  const eventDate = (params.event_date ?? "").trim();
  if (!eventDate) {
    return {
      ok: false,
      message: "Data do evento obrigatória.",
      field: "event_date",
    };
  }
  if (!ISO_DATE.test(eventDate)) {
    return {
      ok: false,
      message: "Data inválida.",
      field: "event_date",
    };
  }

  const { error } = await supabase.from("reading_event").insert({
    user_id: params.user_id,
    reading_id: params.reading_id,
    event_type: params.event_type,
    event_date: eventDate,
    notes: params.notes ?? null,
  });

  if (error) return { ok: false, ...translateSupabaseError(error) };
  return { ok: true };
}

/**
 * Decide qual `reading_event_type` corresponde a uma transição de status.
 *
 * - `tbr` é o pseudo-status "sem reading registrada" — não deveria existir
 *   como valor de `reading.status`, então transições a partir de `tbr` aqui
 *   tratam como criação ("started"). Em compensação, transição PARA tbr
 *   significaria deletar a reading, que é fluxo separado.
 *
 * Retorna `null` se não houve mudança (ou se a transição é no-op
 * conceitualmente).
 */
export function eventTypeForTransition(
  from: ReadingStatusOrTbr | null,
  to: ReadingStatusOrTbr,
): ReadingEventType | null {
  if (from === to) return null;
  if (to === "reading") {
    // Da pausa → resumed; do tbr/finished/abandoned/null → started
    if (from === "paused") return "resumed";
    return "started";
  }
  if (to === "paused") return "paused";
  if (to === "finished") return "finished";
  if (to === "abandoned") return "abandoned";
  return null;
}

type ReadingStatusOrTbr =
  | Database["public"]["Enums"]["reading_status"]
  | "tbr";
