"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export async function deleteReading(
  id: string,
  bookSlug?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { error } = await supabase.from("reading").delete().eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (bookSlug) revalidatePath(`/book/${bookSlug}`);
  revalidatePath("/book");
  return { ok: true };
}
