"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { createReadingEvent, todayISO } from "@/utils/readingEvents";
import { maybeCompleteChallengesForBook } from "@/services/challengeCompletion";

export async function finishReading(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "Leitura inválida." };

  const finish_date =
    ((formData.get("finish_date") as string) || "").trim() || todayISO();
  const ratingRaw = formData.get("rating") as string | null;
  const rating =
    ratingRaw && ratingRaw !== "" ? Number(ratingRaw) || null : null;
  const review = (formData.get("review") as string)?.trim() || null;

  // Lê book_id antes do update pra disparar o gatilho de challenge completion.
  const { data: existing } = await supabase
    .from("reading")
    .select("book_id, status")
    .eq("id", id)
    .maybeSingle();
  const previousStatus = existing?.status ?? null;
  const bookIdForReading = existing?.book_id ?? null;

  const { error } = await supabase
    .from("reading")
    .update({
      status: "finished",
      finish_date,
      rating,
      review,
      // current_page deixa como está; conceito de "página atual" não se aplica
      // após terminar, mas preservar não atrapalha.
    })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  const evResult = await createReadingEvent(supabase, {
    user_id: user.id,
    reading_id: id,
    event_type: "finished",
    event_date: finish_date,
  });
  if (!evResult.ok) return evResult;

  // Sessão 15.1: gatilho de completed_at em challenges. Só dispara se a
  // transição é genuína (previousStatus !== 'finished').
  if (previousStatus !== "finished" && bookIdForReading) {
    await maybeCompleteChallengesForBook(supabase, user.id, bookIdForReading);
  }

  const slug = formData.get("book_slug") as string | null;
  if (slug) revalidatePath(`/book/${slug}`);
  revalidatePath("/book");
  revalidatePath("/collection");
  return { ok: true };
}
