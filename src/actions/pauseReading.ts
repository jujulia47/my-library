"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { createReadingEvent, todayISO } from "@/utils/readingEvents";

export async function pauseReading(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "Leitura inválida." };

  const paused_date =
    ((formData.get("paused_date") as string) || "").trim() || todayISO();

  const { error } = await supabase
    .from("reading")
    .update({ status: "paused" })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  const evResult = await createReadingEvent(supabase, {
    user_id: user.id,
    reading_id: id,
    event_type: "paused",
    event_date: paused_date,
  });
  if (!evResult.ok) return evResult;

  const slug = formData.get("book_slug") as string | null;
  if (slug) revalidatePath(`/book/${slug}`);
  revalidatePath("/book");
  return { ok: true };
}
