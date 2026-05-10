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

export async function createReading(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const book_id = formData.get("book_id") as string;
  if (!book_id) return { ok: false, message: "Livro inválido." };

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

  // Decisão de produto: permitir N readings com status `reading` simultâneas
  // por livro (formatos diferentes, releitura sem pausar a anterior, etc.).

  const { data: inserted, error } = await supabase
    .from("reading")
    .insert({
      book_id,
      user_id: user.id,
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
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, ...translateSupabaseError(error) };
  }

  // Eventos automáticos. Toda reading nasce com `started`. Se o status
  // inicial já é `finished`/`abandoned`/`paused`, gera um segundo event no
  // mesmo trigger pra refletir o estado final. Se algum event falhar,
  // rollback da reading pra evitar histórico inconsistente.
  const startedDate = start_date ?? todayISO();
  const startedResult = await createReadingEvent(supabase, {
    user_id: user.id,
    reading_id: inserted.id,
    event_type: "started",
    event_date: startedDate,
  });
  if (!startedResult.ok) {
    await supabase.from("reading").delete().eq("id", inserted.id);
    return startedResult;
  }

  if (status !== "reading") {
    const closingType = eventTypeForTransition("reading", status);
    if (closingType) {
      // Pra paused/finished/abandoned criados de cara, usa finish_date como
      // data do evento de fechamento. Se não veio, hoje.
      const closingDate =
        status === "finished" || status === "abandoned"
          ? finish_date ?? todayISO()
          : todayISO();
      const closingResult = await createReadingEvent(supabase, {
        user_id: user.id,
        reading_id: inserted.id,
        event_type: closingType,
        event_date: closingDate,
      });
      if (!closingResult.ok) {
        await supabase.from("reading").delete().eq("id", inserted.id);
        return closingResult;
      }
    }
  }

  // Sessão 15.1: reading nascida `finished` também pode completar um challenge.
  if (status === "finished") {
    await maybeCompleteChallengesForBook(supabase, user.id, book_id);
  }

  const slug = formData.get("book_slug") as string | null;
  if (slug) revalidatePath(`/book/${slug}`);
  revalidatePath("/book");
  revalidatePath("/collection");
  return { ok: true };
}
