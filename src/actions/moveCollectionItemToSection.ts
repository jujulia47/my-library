"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Move um item de coleção pra outra seção (drag entre seções no
 * CollectionDetailClient). Atualiza a `section` do item movido e
 * re-sequencia o `position` tanto da seção de destino quanto da de origem.
 *
 * `targetSection` null = "Sem seção". `orderedTargetItemIds` inclui o item
 * movido na posição desejada; `orderedSourceItemIds` é a seção de origem
 * já sem ele.
 */
export async function moveCollectionItemToSection(params: {
  collectionSlug: string;
  itemId: string;
  targetSection: string | null;
  orderedTargetItemIds: string[];
  orderedSourceItemIds: string[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const {
    collectionSlug,
    itemId,
    targetSection,
    orderedTargetItemIds,
    orderedSourceItemIds,
  } = params;

  // 1. Muda a seção do item movido.
  const { error: sectionErr } = await supabase
    .from("collection_item")
    .update({ section: targetSection })
    .eq("id", itemId);
  if (sectionErr) {
    return { ok: false, ...translateSupabaseError(sectionErr) };
  }

  // 2. Re-sequencia position da seção destino e da origem, em paralelo.
  //    RLS já garante que o user só toca nos items da própria coleção.
  const updates = [
    ...orderedTargetItemIds.map((id, idx) =>
      supabase
        .from("collection_item")
        .update({ position: idx })
        .eq("id", id),
    ),
    ...orderedSourceItemIds.map((id, idx) =>
      supabase
        .from("collection_item")
        .update({ position: idx })
        .eq("id", id),
    ),
  ];
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { ok: false, ...translateSupabaseError(failed.error) };
  }

  revalidatePath(`/collection/${collectionSlug}`);
  revalidatePath("/collection");
  return { ok: true };
}
