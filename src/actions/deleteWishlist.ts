"use server";

import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export async function deleteWishlist(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { error } = await supabase.from("wishlist").delete().eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };
  return { ok: true };
}
