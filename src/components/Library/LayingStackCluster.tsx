"use client";

import { BookLayingHorizontal } from "./BookLayingHorizontal";
import { EmptyLayingSlot } from "./EmptyLayingSlot";
import type { ShelfSlot } from "@/utils/shelfLayout";
import type { ShelfBook } from "@/services/libraryData";

type Props = {
  shelfId: string;
  /** 5 slots ordenados por `stackIndex` (0=base, 4=topo). */
  stackSlots: ShelfSlot[];
  booksByPosition: Map<number, ShelfBook>;
  isDragging: boolean;
  onSpineClick?: (book: ShelfBook, rect: DOMRect) => void;
};

const SLOT_WIDTH = 160;
const TOTAL_VISIBLE_SLOTS = 5;

/**
 * Cluster de livros deitados (sessão 17.8). 5 slots horizontais empilhados
 * verticalmente, com gravidade: livros caem pra slots inferiores vagos. Se
 * o cluster tem 3 livros, eles ocupam slots visuais 0,1,2 (base) — slots 3,4
 * ficam vazios no topo.
 *
 * Drop zones:
 *  - `flex-direction: column-reverse` empilha bottom-up.
 *  - Apenas o **próximo slot vazio** (acima do último livro) é drop target
 *    ativo durante drag global; os outros aparecem tracejados normais.
 */
export function LayingStackCluster({
  shelfId,
  stackSlots,
  booksByPosition,
  isDragging,
  onSpineClick,
}: Props) {
  const orderedSlots = [...stackSlots].sort(
    (a, b) => (a.stackIndex ?? 0) - (b.stackIndex ?? 0),
  );

  // Coleta os livros do cluster preservando ordem original (preserva a
  // ligação book ↔ shelf_position; rendering aplica a gravidade).
  const booksInStack: ShelfBook[] = [];
  for (const slot of orderedSlots) {
    const book = booksByPosition.get(slot.position);
    if (book) booksInStack.push(book);
  }

  // Próximo slot disponível pra drop = índice = booksInStack.length (1ª
  // posição vazia visualmente, contando bottom-up).
  const nextDropVisualIndex = booksInStack.length;

  return (
    <div
      className="laying-stack flex-shrink-0 self-end"
      style={{
        width: SLOT_WIDTH,
        display: "flex",
        flexDirection: "column-reverse",
      }}
    >
      {Array.from({ length: TOTAL_VISIBLE_SLOTS }, (_, visualIndex) => {
        const slotForDrop = orderedSlots[visualIndex];
        if (visualIndex < booksInStack.length) {
          const book = booksInStack[visualIndex];
          return (
            <BookLayingHorizontal
              key={book.id}
              book={book}
              onSpineClick={onSpineClick}
            />
          );
        }
        return (
          <EmptyLayingSlot
            key={`empty-${slotForDrop.position}`}
            shelfId={shelfId}
            slot={slotForDrop}
            isDragging={isDragging}
            isValidDrop={visualIndex === nextDropVisualIndex}
          />
        );
      })}
    </div>
  );
}
