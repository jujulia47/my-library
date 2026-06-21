"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { ShelfSymbol } from "./ShelfSymbol";
import { ShelfContent } from "./ShelfContent";
import { ShelfNavigation } from "./ShelfNavigation";
import { ShelfPickerDrawer } from "./ShelfPickerDrawer";
import { BookSpine } from "./BookSpine";
import { moveBookBetweenShelves } from "@/actions/moveBookBetweenShelves";
import { createShelfAndMoveBook } from "@/actions/createShelfAndMoveBook";
import type { Shelf, ShelfBook } from "@/services/libraryData";

const PLATE_HEIGHT = 130;
const FRAME_PADDING = 36;

type Props = {
  shelf: Shelf;
  allShelves: Shelf[];
};

export function ShelfZoom({ shelf, allShelves }: Props) {
  const router = useRouter();
  const frameRef = useRef<HTMLDivElement>(null);
  const [innerWidth, setInnerWidth] = useState<number>(960);
  const [draggedBook, setDraggedBook] = useState<ShelfBook | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pointer: distância de 8px ativa drag — abaixo disso, é click.
  // Touch: long-press 400ms + tolerância de 5px (reduz drag acidental durante
  // scroll vertical no mobile).
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 400, tolerance: 5 },
    }),
  );

  useEffect(() => {
    if (!frameRef.current) return;
    const update = () => {
      if (!frameRef.current) return;
      setInnerWidth(frameRef.current.clientWidth - FRAME_PADDING);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

  const minFrameHeight = 4 * PLATE_HEIGHT + 24;

  const handleDragStart = (event: DragStartEvent) => {
    const book = shelf.books.find((b) => b.id === event.active.id);
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
        (overData.type === "book-position" || overData.type === "shelf-target") &&
        overData.shelfId
      ) {
        // book-position carrega `position` específica; shelf-target → null (fim).
        const targetPosition =
          overData.type === "book-position" && typeof overData.position === "number"
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedBook(null)}
    >
      <div>
        <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
          <Link
            href="/library"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gold/30 hover:border-roasted-chestnut rounded transition-colors"
            style={{ color: "rgba(245, 232, 208, 0.85)" }}
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
            Voltar
          </Link>

          <h2
            className="font-display text-lg flex items-center gap-3"
            style={{ color: "var(--color-paper-aged)" }}
          >
            <ShelfSymbol symbol={shelf.symbol} size={26} />
            Estante
            <span
              className="text-xs italic font-body"
              style={{ color: "rgba(245, 232, 208, 0.65)" }}
            >
              · {shelf.total_books}{" "}
              {shelf.total_books === 1 ? "livro" : "livros"}
              {isPending && " · salvando..."}
            </span>
          </h2>

          <ShelfNavigation currentId={shelf.id} allShelves={allShelves} />
        </div>

        <div
          ref={frameRef}
          className="rounded-lg border-2 shadow-shelf-deep"
          style={{
            background: "var(--color-shelf-frame)",
            borderColor: "var(--color-shelf-border)",
            minHeight: minFrameHeight,
          }}
        >
          {shelf.books.length === 0 ? (
            <p
              className="text-center italic py-12"
              style={{ color: "rgba(245, 232, 208, 0.5)" }}
            >
              Estante vazia. Adicione livros físicos pela página de cada livro
              (campo &quot;Onde está o livro?&quot; → &quot;Em casa&quot;) ou
              clique no &quot;+&quot; pra escolher entre os livros sem
              estante.
            </p>
          ) : (
            <ShelfContent
              books={shelf.books}
              mode="zoom"
              availableWidth={innerWidth}
              plateHeight={PLATE_HEIGHT}
              layout="flow"
              draggable
              shelfId={shelf.id}
            />
          )}
        </div>
      </div>

      <ShelfPickerDrawer
        allShelves={allShelves}
        currentShelfId={shelf.id}
        draggedBook={draggedBook}
      />

      <DragOverlay dropAnimation={null}>
        {draggedBook ? (
          <BookSpine book={draggedBook} mode="zoom" isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
