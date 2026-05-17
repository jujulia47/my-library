"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Reordena items de uma coleção dentro de UMA seção. Recebe os ids dos
 * items na ordem desejada (índice 0 = topo). Atualiza `position` em cada
 * row pra refletir a nova ordem.
 *
 * Limitação intencional (v1): só reordena dentro da mesma seção. Mover
 * item entre seções continua exigindo edição manual da seção. Simplifica
 * a lógica e o caso de uso comum (Clube Vitorianos, listas sem sub-grupos).
 *
 * Estratégia: um UPDATE por item, em paralelo. Cada item tem seu próprio
 * `position` setado pelo índice na ordem recebida. Não usa transação
 * explícita — se algum falhar, retorna erro mas os updates anteriores
 * persistem. O caller pode dar router.refresh() pra reconciliar.
 */
export async function reorderCollectionItems(params: {
  collectionSlug: string;
  orderedItemIds: string[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { collectionSlug, orderedItemIds } = params;
  if (orderedItemIds.length === 0) return { ok: true };

  // Atualiza positions em paralelo. RLS já garante que o user só pode
  // tocar nos items da própria coleção.
  const results = await Promise.all(
    orderedItemIds.map((itemId, index) =>
      supabase
        .from("collection_item")
        .update({ position: index })
        .eq("id", itemId),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { ok: false, ...translateSupabaseError(failed.error) };
  }

  revalidatePath(`/collection/${collectionSlug}`);
  revalidatePath("/collection");
  return { ok: true };
}
