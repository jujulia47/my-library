"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * "Excluir seção" não apaga items — apenas remove a tag `section` de todos
 * eles, fazendo-os cair na pseudo-seção "Sem seção".
 */
export async function deleteSection(params: {
  collection_id: string;
  section_name: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { collection_id, section_name } = params;
  if (!section_name)
    return { ok: false, message: "Seção inválida." };

  const { data: collection } = await supabase
    .from("collection")
    .select("slug")
    .eq("id", collection_id)
    .single();

  const { error } = await supabase
    .from("collection_item")
    .update({ section: null })
    .eq("collection_id", collection_id)
    .eq("section", section_name);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (collection?.slug) revalidatePath(`/collection/${collection.slug}`);
  return { ok: true };
}
