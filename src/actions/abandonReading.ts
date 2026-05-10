"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { createReadingEvent, todayISO } from "@/utils/readingEvents";

export async function abandonReading(
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
  const review = (formData.get("review") as string)?.trim() || null;

  const { error } = await supabase
    .from("reading")
    .update({
      status: "abandoned",
      finish_date,
      review,
    })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  const evResult = await createReadingEvent(supabase, {
    user_id: user.id,
    reading_id: id,
    event_type: "abandoned",
    event_date: finish_date,
  });
  if (!evResult.ok) return evResult;

  const slug = formData.get("book_slug") as string | null;
  if (slug) revalidatePath(`/book/${slug}`);
  revalidatePath("/book");
  return { ok: true };
}
