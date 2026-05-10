"use server";

import type { ActionResult } from "@/utils/translateSupabaseError";
import { createShelf } from "./createShelf";
import { moveBookBetweenShelves } from "./moveBookBetweenShelves";

/**
 * Combina `createShelf` + `moveBookBetweenShelves`. Usado pelo "Nova estante"
 * no drawer do drag — user arrasta um livro pra criar uma estante nova.
 */
export async function createShelfAndMoveBook(params: {
  bookId: string;
}): Promise<ActionResult<{ shelfId: string }>> {
  const created = await createShelf();
  if (!created.ok) return created;
  if (!created.data) {
    return { ok: false, message: "Falha ao criar estante." };
  }

  const moved = await moveBookBetweenShelves({
    bookId: params.bookId,
    targetShelfId: created.data.id,
    targetPosition: 0,
  });
  if (!moved.ok) return moved;

  return { ok: true, data: { shelfId: created.data.id } };
}
