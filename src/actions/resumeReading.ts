"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { createReadingEvent, todayISO } from "@/utils/readingEvents";

/**
 * Volta status pra `reading`. Vindo de `paused`, gera event `resumed`. Vindo
 * de `finished`/`abandoned` (caso raro: usuário marcou errado), também gera
 * `resumed` — semanticamente "voltou pro fluxo ativo". O finish_date da
 * reading volta a `null` pra refletir que ela está em curso de novo.
 */
export async function resumeReading(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "Leitura inválida." };

  const resumed_date =
    ((formData.get("resumed_date") as string) || "").trim() || todayISO();

  const { error } = await supabase
    .from("reading")
    .update({ status: "reading", finish_date: null })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  const evResult = await createReadingEvent(supabase, {
    user_id: user.id,
    reading_id: id,
    event_type: "resumed",
    event_date: resumed_date,
  });
  if (!evResult.ok) return evResult;

  const slug = formData.get("book_slug") as string | null;
  if (slug) revalidatePath(`/book/${slug}`);
  revalidatePath("/book");
  return { ok: true };
}
