"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Inverte `is_favorite` da coleção. Diferente de `archiveCollection`/edit form,
 * essa action é gatilho síncrono usado pela estrela no CollectionCard e no
 * hero da detail — toggle imediato, sem esperar submit.
 *
 * O caminho do edit form (`updateCollection`) também persiste `is_favorite`
 * pra quem está editando metadados. Os dois caminhos coexistem por design.
 */
export async function toggleCollectionFavorite(
  id: string,
): Promise<ActionResult<{ is_favorite: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: existing, error: fetchErr } = await supabase
    .from("collection")
    .select("id, slug, is_favorite")
    .eq("id", id)
    .single();
  if (fetchErr || !existing)
    return { ok: false, message: "Coleção não encontrada." };

  const next = !existing.is_favorite;
  const { error } = await supabase
    .from("collection")
    .update({ is_favorite: next })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/collection");
  revalidatePath(`/collection/${existing.slug}`);
  return { ok: true, data: { is_favorite: next } };
}
