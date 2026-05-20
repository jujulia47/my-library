"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ShelfRow } from "./ShelfRow";
import { ShelfZoomInline } from "./ShelfZoomInline";
import { ShelfPickerDrawer } from "./ShelfPickerDrawer";
import { BookSpine } from "./BookSpine";
import { DustMotes } from "./DustMotes";
import { VaralLuzes } from "@/components/decorations/VaralLuzes";
import { AddShelfSlot } from "./AddShelfSlot";
import { BookOpenOverlay } from "./BookOpenOverlay";
import { UnshelvedSection } from "./UnshelvedSection";
import { moveBookBetweenShelves } from "@/actions/moveBookBetweenShelves";
import { createShelfAndMoveBook } from "@/actions/createShelfAndMoveBook";
import { shelveAllOrphans } from "@/actions/shelveAllOrphans";
import { useResponsiveLibraryConfig } from "./useResponsiveSlotCount";
import type { Shelf, ShelfBook } from "@/services/libraryData";

type OpenBookState = {
  bookSlug: string;
  bookId: string;
  bookTitle: string;
  spineRect: DOMRect;
};

type Props = {
  shelves: Shelf[];
  totalBooks: number;
  /** Livros físicos no acervo sem `shelf_id` — renderizados como seção
   *  "Sem estante" no fim, com lombadas draggable. */
  unshelved: ShelfBook[];
};

/**
 * Componente raiz da `/library` (sessão 17.4 — Option A: parede de
 * prateleiras). Substitui a `LibraryPanorama` antiga. Inclui:
 *  - DndContext envolvendo tudo (drag entre prateleiras).
 *  - Header sticky com count + botão "Nova estante".
 *  - VaralLuzes no topo + DustMotes lateral.
 *  - State-driven `zoomedShelfId` pra abrir vista zoom inline com animação
 *    Framer Motion em vez de mudança de rota.
 *
 * Sessão 17.10: Tentativa de Phase 2 (estante 3D em Three.js) revertida —
 * o BookOpenOverlay continua sendo 3D (Phase 1 funcionou bem), mas a
 * /library volta pra DOM 2D pra preservar todo o DnD do dnd-kit. As
 * melhorias visuais já no CSS (wood grain nas prateleiras, lombadas
 * vintage com raised bands + frisos + gold-foil) continuam aplicáveis.
 */
export function LibraryWall({ shelves, totalBooks, unshelved }: Props) {
  const router = useRouter();
  const [zoomedShelfId, setZoomedShelfId] = useState<string | null>(null);
  const [draggedBook, setDraggedBook] = useState<ShelfBook | null>(null);
  const [openBook, setOpenBook] = useState<OpenBookState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [reorganizing, setReorganizing] = useState(false);
  const [reorganizeError, setReorganizeError] = useState<string | null>(null);
  const { targetCapacity } = useResponsiveLibraryConfig();

  // O botão "Reorganizar" aparece quando vale a pena: há órfãos OU alguma
  // estante tem mais livros do que cabem no breakpoint atual.
  const hasOverflow = shelves.some((s) => s.total_books > targetCapacity);
  const needsReorganize = unshelved.length > 0 || hasOverflow;

  const handleReorganize = () => {
    setReorganizing(true);
    setReorganizeError(null);
    startTransition(async () => {
      const result = await shelveAllOrphans({ targetCapacity });
      setReorganizing(false);
      if (!result.ok) {
        setReorganizeError(result.message);
        return;
      }
      router.refresh();
    });
  };

  // Sessão 17.5: handler dos clicks de lombada — captura DOMRect e abre
  // o overlay state-driven (sem trocar de rota).
  const handleSpineClick = (book: ShelfBook, rect: DOMRect) => {
    setOpenBook({
      bookSlug: book.slug,
      bookId: book.id,
      bookTitle: book.title,
      spineRect: rect,
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 400, tolerance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const book = shelves
      .flatMap((s) => s.books)
      .find((b) => b.id === event.active.id);
    if (book) setDraggedBook(book);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const dragged = draggedBook;
    setDraggedBook(null);
    if (!dragged || !event.over) return;

    const overData = event.over.data.current as
      | { type: string; shelfId?: string; position?: number }
      | undefined;
    if (!overData) return;

    const bookId = String(event.active.id);
    startTransition(async () => {
      let result;
      if (overData.type === "new-shelf") {
        result = await createShelfAndMoveBook({ bookId });
      } else if (
        (overData.type === "book-position" ||
          overData.type === "shelf-target") &&
        overData.shelfId
      ) {
        const targetPosition =
          overData.type === "book-position" &&
          typeof overData.position === "number"
            ? overData.position
            : null;
        result = await moveBookBetweenShelves({
          bookId,
          targetShelfId: overData.shelfId,
          targetPosition,
        });
      }
      if (result?.ok) router.refresh();
    });
  };

  const zoomedShelf = zoomedShelfId
    ? shelves.find((s) => s.id === zoomedShelfId) ?? null
    : null;

  return (
    <DndContext
      id="library-dnd"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedBook(null)}
    >
      <div className="library-page min-h-screen relative">
        {/* Varal de luzinhas no topo (z-[2] pra ficar acima do raio de luz) */}
        <VaralLuzes />

        {/* Partículas de poeira na lateral esquerda (fixed) */}
        <DustMotes />

        {/* Sessão 17.5: header bege gigante removido. Texto sutil dourado
            como overlay no topo da parede, abaixo do varal. */}
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-[3] text-center pointer-events-none"
          aria-hidden={false}
        >
          <h1 className="font-display text-base italic text-gold/70">
            Minha biblioteca
          </h1>
          <p className="text-xs text-gold-deep/60 mt-0.5">
            {totalBooks} {totalBooks === 1 ? "livro" : "livros"} em{" "}
            {shelves.length}{" "}
            {shelves.length === 1 ? "estante" : "estantes"}
            {isPending && " · salvando..."}
          </p>
          {needsReorganize && (
            <div className="mt-2 pointer-events-auto inline-flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleReorganize}
                disabled={reorganizing}
                title={`Distribui todos os livros físicos em estantes com até ${targetCapacity} cada (ajustado pela sua tela). Cria estantes novas se precisar; estantes extras ficam vazias pra você deletar.`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gold/40 bg-gold/10 text-gold text-xs font-body font-medium transition-colors hover:bg-gold/20 hover:text-gold-deep disabled:opacity-60 disabled:cursor-wait"
              >
                {reorganizing ? "Reorganizando..." : "Reorganizar biblioteca"}
              </button>
              {reorganizeError && (
                <p className="text-[11px] text-burgundy bg-burgundy/10 border border-burgundy/30 rounded px-2 py-0.5">
                  {reorganizeError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sessão 17.5: parede inteira dims/blur quando overlay de livro
            está aberto — sensação de "livro flutuando à frente". */}
        <motion.div
          className="space-y-2 pt-32 pb-12 relative z-[2]"
          animate={{
            opacity: openBook ? 0.4 : 1,
            scale: openBook ? 0.98 : 1,
            filter: openBook ? "blur(2px)" : "blur(0px)",
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {shelves.length === 0 ? (
            <LibraryEmptyState />
          ) : (
            <>
              {shelves.map((shelf) => (
                <ShelfRow
                  key={shelf.id}
                  shelf={shelf}
                  onZoom={setZoomedShelfId}
                  onSpineClick={handleSpineClick}
                />
              ))}
              {/* Slot integrado de "+ Nova estante" — ghost shelf no fim */}
              <AddShelfSlot />
              {/* Livros sem estante — arrastáveis pras estantes reais */}
              <UnshelvedSection
                books={unshelved}
                onSpineClick={handleSpineClick}
              />
            </>
          )}
        </motion.div>

        {/* Vista zoom inline (state-driven) */}
        {zoomedShelf && (
          <ShelfZoomInline
            shelf={zoomedShelf}
            onClose={() => setZoomedShelfId(null)}
          />
        )}

        {/* Drag drawer */}
        <ShelfPickerDrawer
          allShelves={shelves}
          currentShelfId={draggedBook?.shelf_id ?? ""}
          draggedBook={draggedBook}
        />

        <DragOverlay dropAnimation={null}>
          {draggedBook ? (
            <BookSpine book={draggedBook} mode="wall" isDragOverlay />
          ) : null}
        </DragOverlay>

        {/* Overlay de livro abrindo (state-driven, sessão 17.5) */}
        <AnimatePresence>
          {openBook && (
            <BookOpenOverlay
              key={openBook.bookSlug}
              bookSlug={openBook.bookSlug}
              bookId={openBook.bookId}
              bookTitle={openBook.bookTitle}
              originRect={openBook.spineRect}
              onClose={() => setOpenBook(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </DndContext>
  );
}

function LibraryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <p
        className="font-display text-2xl mb-2"
        style={{ color: "var(--color-paper-aged)" }}
      >
        Sua biblioteca ainda está vazia.
      </p>
      <p
        className="text-sm italic mb-6"
        style={{ color: "rgba(245, 232, 208, 0.6)" }}
      >
        Crie sua primeira estante para começar a organizar.
      </p>
      <div className="w-full max-w-md">
        <AddShelfSlot />
      </div>
    </div>
  );
}
