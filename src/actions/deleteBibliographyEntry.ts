"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export async function deleteBibliographyEntry(
  id: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  // Captura slug pra revalidatePath
  const { data: existing } = await supabase
    .from("author_bibliography")
    .select("author:author_id(slug)")
    .eq("id", id)
    .single();
  const slug = (existing as unknown as { author: { slug: string } | null } | null)
    ?.author?.slug;

  const { error } = await supabase
    .from("author_bibliography")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (slug) revalidatePath(`/author/${slug}`);
  return { ok: true };
}
