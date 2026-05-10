"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDndContext } from "@dnd-kit/core";
import { BookSpine } from "./BookSpine";
import { BookSpineTilted } from "./BookSpineTilted";
import { EmptySlot } from "./EmptySlot";
import { LayingStackCluster } from "./LayingStackCluster";
import { ShelfLabel } from "./ShelfLabel";
import { AddBookSlot } from "./AddBookSlot";
import { EmptyShelfCta } from "./EmptyShelfCta";
import { DeleteShelfButton } from "./DeleteShelfButton";
import { renderDecoration } from "./decorations";
import {
  getShelfLayout,
  DEFAULT_SHELF_SLOTS,
  type ShelfSlot,
} from "@/utils/shelfLayout";
import type { Shelf, ShelfBook } from "@/services/libraryData";

type Props = {
  shelf: Shelf;
  onZoom?: (shelfId: string) => void;
  onSpineClick?: (book: ShelfBook, rect: DOMRect) => void;
};

type RenderItem =
  | { kind: "single"; slot: ShelfSlot }
  | { kind: "stack"; stackId: number; slots: ShelfSlot[] };

/**
 * Sessão 17.6: prateleira com slots predefinidos.
 * Sessão 17.8: tipo `laying` virou cluster `laying-stack` (5 slots agrupados
 * com gravidade). ShelfRow agrupa slots do mesmo `stackId` em um único item
 * `<LayingStackCluster>` ocupando 1 posição visual horizontal.
 */
export function ShelfRow({ shelf, onZoom, onSpineClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [decorEnabled, setDecorEnabled] = useState(false);

  const { active } = useDndContext();
  const isDragging = active != null;

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDecorEnabled(true);
      },
      { rootMargin: "800px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const layout = useMemo(
    () => getShelfLayout(shelf.id, DEFAULT_SHELF_SLOTS),
    [shelf.id],
  );

  // Mapa position → book.
  //  1. Books com shelf_position válido em slot NÃO-decoração: ocupam.
  //  2. Books inválidos OU em slot decoração: viram unassigned.
  //  3. Unassigned preenchem slots livres não-decoração em ordem.
  //  4. Warn em dev pra órfãos (livro sem slot).
  const booksByPosition = useMemo(() => {
    const map = new Map<number, ShelfBook>();
    const placed = new Set<string>();
    const unassigned: ShelfBook[] = [];

    for (const book of shelf.books) {
      const pos = book.shelf_position;
      const isValid =
        typeof pos === "number" &&
        Number.isInteger(pos) &&
        pos >= 0 &&
        pos < layout.totalSlots;
      if (!isValid) {
        unassigned.push(book);
        continue;
      }
      const slot = layout.slots[pos];
      if (slot.type === "decoration" || map.has(pos)) {
        unassigned.push(book);
        continue;
      }
      map.set(pos, book);
      placed.add(book.id);
    }

    let cursor = 0;
    for (const book of unassigned) {
      while (cursor < layout.totalSlots) {
        const slot = layout.slots[cursor];
        if (slot.type !== "decoration" && !map.has(cursor)) {
          map.set(cursor, book);
          placed.add(book.id);
          cursor += 1;
          break;
        }
        cursor += 1;
      }
    }

    if (process.env.NODE_ENV !== "production") {
      const orphans = shelf.books.filter((b) => !placed.has(b.id));
      if (orphans.length > 0) {
        console.warn(
          `[ShelfRow ${shelf.id}] ${orphans.length} livro(s) sem slot:`,
          orphans.map((b) => `${b.title} (${b.id})`),
        );
      }
    }

    return map;
  }, [shelf.books, shelf.id, layout]);

  // Agrupa slots `laying-stack` por `stackId` em `RenderItem`s. Cada cluster
  // vira 1 item visual; demais slots são `single`.
  const renderItems = useMemo<RenderItem[]>(() => {
    const items: RenderItem[] = [];
    const seenStacks = new Set<number>();
    const stackSlotsById = new Map<number, ShelfSlot[]>();

    for (const slot of layout.slots) {
      if (slot.type === "laying-stack" && slot.stackId != null) {
        const list = stackSlotsById.get(slot.stackId) ?? [];
        list.push(slot);
        stackSlotsById.set(slot.stackId, list);
      }
    }

    for (const slot of layout.slots) {
      if (slot.type === "laying-stack" && slot.stackId != null) {
        if (seenStacks.has(slot.stackId)) continue;
        seenStacks.add(slot.stackId);
        items.push({
          kind: "stack",
          stackId: slot.stackId,
          slots: stackSlotsById.get(slot.stackId) ?? [],
        });
      } else {
        items.push({ kind: "single", slot });
      }
    }

    return items;
  }, [layout]);

  const isTiltedSupported = (slot: ShelfSlot): boolean => {
    if (slot.type !== "tilted" || !slot.leanDirection) return false;
    const dir = slot.leanDirection;
    const neighborPos =
      dir === "right" ? slot.position + 1 : slot.position - 1;
    if (neighborPos < 0 || neighborPos >= layout.totalSlots) return false;
    const neighborSlot = layout.slots[neighborPos];
    if (neighborSlot.type === "decoration") return true;
    if (neighborSlot.type === "laying-stack") return true;
    return booksByPosition.has(neighborPos);
  };

  // Mobile detection: em viewports estreitas, quebramos a prateleira em
  // múltiplas "sub-prateleiras", cada uma com sua prancha de madeira própria
  // (em vez de uma única prancha com livros flutuando acima — o que dava a
  // sensação de "livro voando" reportada na sessão).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Quantos itens cabem por sub-prateleira em mobile. Pequenas variações de
  // largura de slot (standing 32, tilted 36, laying-stack ~90, decoration
  // ~70) são absorvidas com folga em 6 itens por linha em 375-414px viewport.
  const ITEMS_PER_ROW_MOBILE = 6;
  const subRows: RenderItem[][] = isMobile
    ? (() => {
        const out: RenderItem[][] = [];
        for (let i = 0; i < renderItems.length; i += ITEMS_PER_ROW_MOBILE) {
          out.push(renderItems.slice(i, i + ITEMS_PER_ROW_MOBILE));
        }
        return out.length > 0 ? out : [[]];
      })()
    : [renderItems];

  if (shelf.books.length === 0) {
    return (
      <div ref={ref} className="shelf-row" data-shelf-id={shelf.id}>
        <ShelfLabel
          symbol={shelf.symbol}
          bookCount={0}
          onClick={onZoom ? () => onZoom(shelf.id) : undefined}
        />
        <div className="shelf-sub-row">
          <div className="shelf-wood-bottom" aria-hidden />
          <div className="shelf-content">
            <EmptyShelfCta shelfId={shelf.id} />
            {decorEnabled && (
              <span className="ml-auto self-end pb-1">
                {renderDecoration("vela", `${shelf.id}-empty`)}
              </span>
            )}
          </div>
        </div>
        {/* Botão de excluir estante vazia — top-right da row, sutil */}
        <div className="absolute top-1 right-2 z-10">
          <DeleteShelfButton shelfId={shelf.id} />
        </div>
      </div>
    );
  }

  const addSlotPosition = layout.totalSlots;

  return (
    <div ref={ref} className="shelf-row" data-shelf-id={shelf.id}>
      <ShelfLabel
        symbol={shelf.symbol}
        bookCount={shelf.books.length}
        onClick={onZoom ? () => onZoom(shelf.id) : undefined}
      />
      {subRows.map((rowItems, rowIdx) => {
        const isLastRow = rowIdx === subRows.length - 1;
        return (
          <div key={rowIdx} className="shelf-sub-row">
            <div className="shelf-wood-bottom" aria-hidden />
            <div className="shelf-content">
              {rowItems.map((item) => {
                if (item.kind === "stack") {
                  return (
                    <LayingStackCluster
                      key={`stack-${item.stackId}`}
                      shelfId={shelf.id}
                      stackSlots={item.slots}
                      booksByPosition={booksByPosition}
                      isDragging={isDragging}
                      onSpineClick={onSpineClick}
                    />
                  );
                }

                const slot = item.slot;
                if (slot.type === "decoration") {
                  if (!decorEnabled || !slot.decorationVariant) {
                    return (
                      <span
                        key={`d-${slot.position}`}
                        className="empty-slot-laying"
                        aria-hidden
                      />
                    );
                  }
                  return (
                    <span
                      key={`d-${slot.position}`}
                      className="decoration-slot self-end z-[2]"
                    >
                      {renderDecoration(
                        slot.decorationVariant,
                        `${shelf.id}-d-${slot.position}`,
                      )}
                    </span>
                  );
                }

                const book = booksByPosition.get(slot.position);
                if (!book) {
                  return (
                    <EmptySlot
                      key={`e-${slot.position}`}
                      shelfId={shelf.id}
                      slot={slot}
                      isDragging={isDragging}
                    />
                  );
                }

                if (slot.type === "standing") {
                  return (
                    <BookSpine
                      key={book.id}
                      book={book}
                      mode="wall"
                      draggable
                      onSpineClick={onSpineClick}
                    />
                  );
                }
                if (slot.type === "tilted") {
                  return (
                    <BookSpineTilted
                      key={book.id}
                      book={book}
                      leanDirection={slot.leanDirection ?? "left"}
                      isSupported={isTiltedSupported(slot)}
                      onSpineClick={onSpineClick}
                    />
                  );
                }
                return null;
              })}
              {isLastRow && (
                <AddBookSlot shelfId={shelf.id} position={addSlotPosition} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
