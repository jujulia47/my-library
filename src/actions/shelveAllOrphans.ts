"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { ALL_SHELF_SYMBOLS, type ShelfSymbol } from "@/services/libraryData";

/**
 * Capacidade alvo por estante. ~80 acomoda tela wide/ultrawide sem deixar
 * muita madeira vazia. Telas estreitas ainda têm a folga visível ali porque
 * o layout do `ShelfRow` mede largura em runtime — esse número é só pra
 * decidir distribuição.
 */
const VISIBLE_CAPACITY = 80;

/**
 * Rebalanceia a biblioteca: junta todos os livros físicos do acervo
 * (owned/lent_out + formats_owned contém physical), preserva a ordem
 * atual (shelf.ordering ASC + shelf_position ASC; órfãos no fim), e
 * distribui em chunks de `targetCapacity` pelas estantes em ordem. Se
 * faltam estantes, cria novas com símbolos não-usados. Se sobram, ficam
 * vazias (o user deleta via "Excluir estante").
 *
 * É destrutivo da organização específica por estante (um livro que estava
 * na "moon" pode acabar na "sun" se houver mais books antes dele), mas
 * preserva a ordem visual global — o cursor visual continua o mesmo.
 *
 * `targetCapacity` opcional: cliente pode passar o `itemsPerRow` medido em
 * runtime pra match exato com a largura da tela. Sem isso, usa o default.
 */
export async function shelveAllOrphans(params?: {
  targetCapacity?: number;
}): Promise<
  ActionResult<{
    moved: number;
    shelves_created: number;
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const target = Math.max(
    15,
    Math.min(120, params?.targetCapacity ?? VISIBLE_CAPACITY),
  );

  // 1. Estantes existentes em ordem.
  const { data: shelvesRaw, error: shelvesErr } = await supabase
    .from("shelf")
    .select("id, ordering, symbol")
    .eq("user_id", user.id)
    .order("ordering", { ascending: true });
  if (shelvesErr) return { ok: false, ...translateSupabaseError(shelvesErr) };

  // 2. Todos os livros físicos do acervo.
  const { data: booksRaw, error: booksErr } = await supabase
    .from("book")
    .select("id, shelf_id, shelf_position")
    .eq("user_id", user.id)
    .in("ownership_status", ["owned", "lent_out"])
    .contains("formats_owned", ["physical"]);
  if (booksErr) return { ok: false, ...translateSupabaseError(booksErr) };

  if (!booksRaw || booksRaw.length === 0) {
    return { ok: true, data: { moved: 0, shelves_created: 0 } };
  }

  // 3. Ordena livros: shelf ordering ASC, shelf_position ASC. Órfãos vão
  //    pro fim (preserva ordem natural de leitura).
  const shelfOrderMap = new Map<string, number>();
  (shelvesRaw ?? []).forEach((s, idx) => {
    shelfOrderMap.set(s.id, idx);
  });
  const books = [...booksRaw].sort((a, b) => {
    const ao =
      a.shelf_id != null ? shelfOrderMap.get(a.shelf_id) ?? 99999 : 99999;
    const bo =
      b.shelf_id != null ? shelfOrderMap.get(b.shelf_id) ?? 99999 : 99999;
    if (ao !== bo) return ao - bo;
    return (a.shelf_position ?? 99999) - (b.shelf_position ?? 99999);
  });

  // 4. Estado mutável de estantes (pode crescer).
  type ShelfRec = { id: string; ordering: number; symbol: ShelfSymbol };
  const shelves: ShelfRec[] = (shelvesRaw ?? []).map((s) => ({
    id: s.id,
    ordering: (s as unknown as { ordering: number }).ordering,
    symbol: s.symbol as ShelfSymbol,
  }));
  const usedSymbols = new Set<ShelfSymbol>(shelves.map((s) => s.symbol));
  let nextOrdering = Math.max(-1, ...shelves.map((s) => s.ordering)) + 1;

  // 5. Distribui em chunks de `target`.
  let cursorBookIdx = 0;
  let cursorShelfIdx = 0;
  let moved = 0;
  let shelvesCreated = 0;

  while (cursorBookIdx < books.length) {
    // Garante estante alvo (cria se acabou).
    if (cursorShelfIdx >= shelves.length) {
      const symbol: ShelfSymbol =
        ALL_SHELF_SYMBOLS.find((s) => !usedSymbols.has(s)) ??
        ALL_SHELF_SYMBOLS[shelvesCreated % ALL_SHELF_SYMBOLS.length];
      const { data: created, error: createErr } = await supabase
        .from("shelf")
        .insert({
          user_id: user.id,
          ordering: nextOrdering,
          symbol,
        })
        .select("id, ordering, symbol")
        .single();
      if (createErr || !created) {
        return { ok: false, ...translateSupabaseError(createErr) };
      }
      shelves.push({
        id: created.id,
        ordering: nextOrdering,
        symbol,
      });
      usedSymbols.add(symbol);
      nextOrdering += 1;
      shelvesCreated += 1;
    }

    const shelf = shelves[cursorShelfIdx];
    const chunkEnd = Math.min(books.length, cursorBookIdx + target);

    // Atualiza só os livros que mudaram (idempotente: rodar duas vezes
    // seguidas faz quase zero updates).
    for (let pos = 0; cursorBookIdx + pos < chunkEnd; pos += 1) {
      const book = books[cursorBookIdx + pos];
      if (book.shelf_id === shelf.id && book.shelf_position === pos) continue;
      const { error: updateErr } = await supabase
        .from("book")
        .update({ shelf_id: shelf.id, shelf_position: pos })
        .eq("id", book.id);
      if (updateErr) return { ok: false, ...translateSupabaseError(updateErr) };
      moved += 1;
    }

    cursorBookIdx = chunkEnd;
    cursorShelfIdx += 1;
  }

  revalidatePath("/library");
  return { ok: true, data: { moved, shelves_created: shelvesCreated } };
}
