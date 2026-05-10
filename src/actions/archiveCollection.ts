"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Toggle de arquivamento. Coleções arquivadas saem da listagem default;
 * só aparecem com filtro "Arquivadas".
 */
export async function archiveCollection(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data, error } = await supabase
    .from("collection")
    .update({ is_archived: archived })
    .eq("id", id)
    .select("slug")
    .single();

  if (error || !data) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/collection");
  revalidatePath(`/collection/${data.slug}`);
  return { ok: true };
}
