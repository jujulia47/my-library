"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { createReadingEvent, todayISO } from "@/utils/readingEvents";

/**
 * Para uma reading existente que não está em curso (paused/finished/abandoned),
 * volta status pra `reading` e cria event `started`. Distinção de
 * `resumeReading`: aqui é uso pelo botão "Iniciar leitura" da UI, que faz
 * sentido pra "mudei de ideia, vou começar de novo do zero". Em termos de
 * banco a transição é a mesma de `resumeReading`, mas semanticamente
 * registramos como `started` em vez de `resumed`.
 */
export async function startReading(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "Leitura inválida." };

  const start_date =
    ((formData.get("start_date") as string) || "").trim() || todayISO();

  const { error } = await supabase
    .from("reading")
    .update({ status: "reading", finish_date: null, start_date })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  const evResult = await createReadingEvent(supabase, {
    user_id: user.id,
    reading_id: id,
    event_type: "started",
    event_date: start_date,
  });
  if (!evResult.ok) return evResult;

  const slug = formData.get("book_slug") as string | null;
  if (slug) revalidatePath(`/book/${slug}`);
  revalidatePath("/book");
  return { ok: true };
}
