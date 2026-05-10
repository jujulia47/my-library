"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export async function removeCollectionItem(
  itemId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  // Capturar slug antes do delete pra revalidatePath.
  const { data: item } = await supabase
    .from("collection_item")
    .select("collection:collection_id(slug)")
    .eq("id", itemId)
    .single();
  const slug = (item as unknown as { collection: { slug: string } | null } | null)
    ?.collection?.slug;

  const { error } = await supabase
    .from("collection_item")
    .delete()
    .eq("id", itemId);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (slug) revalidatePath(`/collection/${slug}`);
  revalidatePath("/collection");
  return { ok: true };
}
