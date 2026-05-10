"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { ALL_SHELF_SYMBOLS, type ShelfSymbol } from "@/services/libraryData";

/**
 * Limite arbitrário por estante. Quando user dropa um livro de outra estante
 * numa estante já com `SHELF_LIMIT` livros, o sistema cria automaticamente
 * uma nova estante e move o livro pra ela. Limite vale só na transferência
 * entre estantes — reorder dentro da mesma não é bloqueado.
 */
const SHELF_LIMIT = 80;

type MoveParams = {
  bookId: string;
  targetShelfId: string;
  /** Posição alvo. `null` = colocar no fim da estante. */
  targetPosition: number | null;
};

/**
 * Move um livro entre estantes ou reordena dentro da mesma. Em caso de drop
 * em posição específica, chama o RPC `shift_shelf_positions` pra abrir o slot.
 *
 * Regras:
 *  - Ownership do book e da shelf checados (RLS já filtra, validação extra).
 *  - Se target shelf cheia E vindo de outra estante: cria nova shelf
 *    (`createShelf` interno) e move pra ela.
 *  - `targetPosition === null`: vai pro fim (max+1).
 *  - `targetPosition` numérico: shift dos demais e atribui.
 */
export async function moveBookBetweenShelves(
  params: MoveParams,
): Promise<ActionResult<{ created_new_shelf: boolean; final_shelf_id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: book } = await supabase
    .from("book")
    .select("id, shelf_id, shelf_position")
    .eq("id", params.bookId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!book) return { ok: false, message: "Livro não encontrado." };

  const { data: targetShelf } = await supabase
    .from("shelf")
    .select("id")
    .eq("id", params.targetShelfId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!targetShelf)
    return { ok: false, message: "Estante alvo não encontrada." };

  const isMovingFromAnother = book.shelf_id !== params.targetShelfId;

  // Conta livros físicos atuais na target. Não considera doados/vendidos —
  // eles têm shelf_id null pelo design (ver updateBookFull em 16.1).
  let actualTargetShelfId = params.targetShelfId;
  let createdNewShelf = false;

  if (isMovingFromAnother) {
    const { count } = await supabase
      .from("book")
      .select("id", { count: "exact", head: true })
      .eq("shelf_id", params.targetShelfId)
      .in("ownership_status", ["owned", "lent_out"]);

    if ((count ?? 0) >= SHELF_LIMIT) {
      // Cria nova shelf inline (sem chamar createShelf pra evitar
      // double-revalidate). Símbolo: primeiro não usado.
      const { data: existing } = await supabase
        .from("shelf")
        .select("ordering, symbol")
        .eq("user_id", user.id)
        .order("ordering", { ascending: false });

      const nextOrdering = (existing?.[0]?.ordering ?? -1) + 1;
      const used = new Set((existing ?? []).map((s) => s.symbol));
      const nextSymbol: ShelfSymbol =
        ALL_SHELF_SYMBOLS.find((s) => !used.has(s)) ?? "moon";

      const { data: created, error: createErr } = await supabase
        .from("shelf")
        .insert({
          user_id: user.id,
          ordering: nextOrdering,
          symbol: nextSymbol,
        })
        .select("id")
        .single();

      if (createErr || !created) {
        return { ok: false, ...translateSupabaseError(createErr) };
      }
      actualTargetShelfId = created.id;
      createdNewShelf = true;
    }
  }

  // Calcula posição final.
  let finalPosition: number;
  if (params.targetPosition === null) {
    const { data: maxRow } = await supabase
      .from("book")
      .select("shelf_position")
      .eq("shelf_id", actualTargetShelfId)
      .order("shelf_position", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    finalPosition = (maxRow?.shelf_position ?? -1) + 1;
  } else {
    finalPosition = params.targetPosition;
    // Shift dos livros já em posição >= finalPosition (excluindo o próprio
    // que está sendo movido — caso reorder dentro da mesma estante).
    const { error: shiftErr } = await supabase.rpc("shift_shelf_positions", {
      p_shelf_id: actualTargetShelfId,
      p_from_position: finalPosition,
      p_exclude_book_id: params.bookId,
    });
    if (shiftErr) return { ok: false, ...translateSupabaseError(shiftErr) };
  }

  const { error: updateErr } = await supabase
    .from("book")
    .update({
      shelf_id: actualTargetShelfId,
      shelf_position: finalPosition,
    })
    .eq("id", params.bookId);

  if (updateErr) return { ok: false, ...translateSupabaseError(updateErr) };

  revalidatePath("/library");
  revalidatePath(`/library/shelf/${actualTargetShelfId}`);
  if (book.shelf_id && book.shelf_id !== actualTargetShelfId) {
    revalidatePath(`/library/shelf/${book.shelf_id}`);
  }

  return {
    ok: true,
    data: {
      created_new_shelf: createdNewShelf,
      final_shelf_id: actualTargetShelfId,
    },
  };
}
