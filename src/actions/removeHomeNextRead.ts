"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Remove um livro da curadoria de "próximas leituras" da home.
 * Recebe o ID da linha em `home_next_read` (não o book_id).
 */
export async function removeHomeNextRead(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { error } = await supabase
    .from("home_next_read")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/");
  return { ok: true, data: null };
}
