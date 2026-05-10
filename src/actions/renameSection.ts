"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Atualiza `section` de todos os items de uma coleção que estão na seção
 * `oldName` pra `newName`. `oldName` pode ser null (representa "Sem seção").
 * Se `newName` é vazio/null, equivale a deleteSection.
 */
export async function renameSection(params: {
  collection_id: string;
  old_name: string | null;
  new_name: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { collection_id } = params;
  const newName = (params.new_name ?? "").trim();
  if (!newName)
    return { ok: false, message: "Nome da seção obrigatório.", field: "new_name" };
  if (newName === params.old_name) return { ok: true };

  const { data: collection } = await supabase
    .from("collection")
    .select("slug")
    .eq("id", collection_id)
    .single();

  let updateBuilder = supabase
    .from("collection_item")
    .update({ section: newName })
    .eq("collection_id", collection_id);
  updateBuilder =
    params.old_name === null
      ? updateBuilder.is("section", null)
      : updateBuilder.eq("section", params.old_name);

  const { error } = await updateBuilder;
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (collection?.slug) revalidatePath(`/collection/${collection.slug}`);
  return { ok: true };
}
