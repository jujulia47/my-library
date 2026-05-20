"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { ShelfSymbol } from "./ShelfSymbol";
import { BookSpine } from "./BookSpine";
import { AddBookSlot } from "./AddBookSlot";
import { EmptyShelfCta } from "./EmptyShelfCta";
import { DeleteShelfButton } from "./DeleteShelfButton";
import { renderDecoration } from "./decorations";
import { getShelfLayout } from "@/utils/shelfLayout";
import { useResponsiveSlotCount } from "./useResponsiveSlotCount";
import type { Shelf, ShelfBook } from "@/services/libraryData";

type Props = {
  shelf: Shelf;
  onClose: () => void;
};

/**
 * Vista zoom inline da prateleira (state-driven dentro de LibraryWall).
 * Sessão 17.8: usa o mesmo `getShelfLayout` do ShelfRow — render coerente
 * com a parede, mas em escala maior. Slots vazios são pulados (zoom focado
 * no que tem).
 */
export function ShelfZoomInline({ shelf, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const slotCount = useResponsiveSlotCount();
  const layout = useMemo(
    () => getShelfLayout(shelf.id, slotCount),
    [shelf.id, slotCount],
  );

  // Mapa position → book (mesma lógica simplificada do ShelfRow).
  const booksByPosition = useMemo(() => {
    const map = new Map<number, ShelfBook>();
    const unassigned: ShelfBook[] = [];
    for (const book of shelf.books) {
      const pos = book.shelf_position;
      const valid =
        typeof pos === "number" &&
        pos >= 0 &&
        pos < layout.totalSlots &&
        layout.slots[pos].type !== "decoration";
      if (!valid || map.has(pos!)) {
        unassigned.push(book);
      } else {
        map.set(pos!, book);
      }
    }
    let cursor = 0;
    for (const book of unassigned) {
      while (cursor < layout.totalSlots) {
        const slot = layout.slots[cursor];
        if (slot.type !== "decoration" && !map.has(cursor)) {
          map.set(cursor, book);
          cursor += 1;
          break;
        }
        cursor += 1;
      }
    }
    return map;
  }, [shelf.books, layout]);

  const nextPosition = layout.totalSlots;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-0 z-40"
        style={{ background: "var(--library-wall-mid)" }}
      >
        <div className="library-page absolute inset-0 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-gold hover:text-gold-deep transition-colors"
              aria-label="Voltar pra parede"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="font-display italic">Voltar</span>
            </button>
            <h2
              className="font-display text-lg flex items-center gap-3"
              style={{ color: "var(--color-paper-aged)" }}
            >
              <ShelfSymbol symbol={shelf.symbol} size={32} />
              <span>
                {shelf.books.length}{" "}
                {shelf.books.length === 1 ? "livro" : "livros"}
              </span>
            </h2>
            <div className="w-20 flex justify-end">
              {shelf.books.length === 0 && (
                <DeleteShelfButton shelfId={shelf.id} />
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-12 overflow-x-auto">
            <div className="shelf-row" style={{ height: 480 }}>
              {/* shelf-sub-row com column-reverse posiciona wood embaixo e
                  content em cima — mesma estrutura do wall view. Sem isso,
                  o flex column da shelf-row jogava wood pra cima e livros
                  pra baixo. */}
              <div className="shelf-sub-row">
                <div
                  className="shelf-wood-bottom"
                  style={{ height: 32 }}
                  aria-hidden
                />
                <div
                  className="shelf-content"
                  style={{ paddingLeft: 16, gap: 10 }}
                >
                  {shelf.books.length === 0 ? (
                    <EmptyShelfCta shelfId={shelf.id} large />
                  ) : (
                    <>
                      {layout.slots.map((slot) => {
                        if (
                          slot.type === "decoration" &&
                          slot.decorationVariant
                        ) {
                          return (
                            <span
                              key={`d-${slot.position}`}
                              className="self-end pb-2 z-[2]"
                              style={{ transform: "scale(1.6)" }}
                            >
                              {renderDecoration(
                                slot.decorationVariant,
                                `${shelf.id}-d-${slot.position}`,
                              )}
                            </span>
                          );
                        }
                        const book = booksByPosition.get(slot.position);
                        if (!book) return null;
                        // Em zoom, scale grande dá efeito "zoom". O BookSpine
                        // tem altura fixa (160px) — o wrapper alinha pelo
                        // bottom pra livro sentar logo acima da wood.
                        return (
                          <div
                            key={book.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-end",
                              marginRight: 14,
                              marginLeft: 14,
                              transform: "scale(1.6)",
                              transformOrigin: "bottom center",
                            }}
                          >
                            <BookSpine
                              book={book}
                              mode="wall"
                              draggable
                              disableOpen
                            />
                          </div>
                        );
                      })}
                      <AddBookSlot
                        shelfId={shelf.id}
                        position={nextPosition}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
