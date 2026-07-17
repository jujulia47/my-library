"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/** Remove um período de capacidade. */
export async function deleteReadingCapacity(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { error } = await supabase
    .from("reading_capacity")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: null };
}
