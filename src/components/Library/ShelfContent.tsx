"use client";

import { useDroppable } from "@dnd-kit/core";
import { BookSpine } from "./BookSpine";
import { BookLayingDown } from "./BookLayingDown";
import type { ShelfBook } from "@/services/libraryData";

type Mode = "mini" | "zoom";

type Props = {
  books: ShelfBook[];
  mode: Mode;
  /** Largura útil disponível em px pra cálculo de quebra de prateleira. */
  availableWidth: number;
  /** Altura de cada prateleira em px. */
  plateHeight: number;
  layout?: "absolute" | "flow";
  /**
   * Quando true, lombadas são draggable e cada prateleira ganha um EmptySlot
   * dropável no fim (sessão 16.2). Só faz sentido em mode="zoom".
   */
  draggable?: boolean;
  /** Id da estante alvo do EmptySlot (necessário se draggable). */
  shelfId?: string;
};

const GAP_PX = 1.5;

function distributeBooksIntoShelves(
  books: ShelfBook[],
  availableWidth: number,
  mode: Mode,
): ShelfBook[][] {
  if (books.length === 0) return [[]];
  const shelves: ShelfBook[][] = [[]];
  let current = 0;
  const widthOf = (b: ShelfBook): number => {
    const base =
      mode === "mini" ? Math.max(8, b.spine_width / 1.6) : b.spine_width;
    return b.is_laying_down ? base * 0.7 : base;
  };

  for (const b of books) {
    const w = widthOf(b) + GAP_PX;
    if (current > 0 && current + w > availableWidth) {
      shelves.push([]);
      current = 0;
    }
    shelves[shelves.length - 1].push(b);
    current += w;
  }
  return shelves;
}

export function ShelfContent({
  books,
  mode,
  availableWidth,
  plateHeight,
  layout = "absolute",
  draggable = false,
  shelfId,
}: Props) {
  const plates = distributeBooksIntoShelves(books, availableWidth, mode);
  const wrapperClass =
    layout === "absolute"
      ? "absolute inset-0 flex flex-col p-2.5"
      : "flex flex-col p-2.5";

  // Posição base do EmptySlot na última prateleira: max(shelf_position) + 1.
  // Pra prateleiras intermediárias, posição = posição do último livro + 1.
  return (
    <div className={wrapperClass}>
      {plates.map((plate, idx) => {
        const isLastPlate = idx === plates.length - 1;
        const last = plate[plate.length - 1];
        const insertPosition = last ? last.shelf_position + 1 : 0;
        return (
          <ShelfPlate
            key={idx}
            books={plate}
            mode={mode}
            isLast={isLastPlate}
            height={plateHeight}
            draggable={draggable}
            // EmptySlot só na última prateleira pra evitar muitos slots.
            showEmptySlot={draggable && isLastPlate && !!shelfId}
            shelfId={shelfId}
            insertPosition={insertPosition}
          />
        );
      })}
    </div>
  );
}

function ShelfPlate({
  books,
  mode,
  isLast,
  height,
  draggable,
  showEmptySlot,
  shelfId,
  insertPosition,
}: {
  books: ShelfBook[];
  mode: Mode;
  isLast: boolean;
  height: number;
  draggable: boolean;
  showEmptySlot: boolean;
  shelfId: string | undefined;
  insertPosition: number;
}) {
  return (
    <div
      className="flex items-end px-1 relative"
      style={{
        height,
        gap: GAP_PX,
        background:
          "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.18) 100%)",
        borderBottom: isLast ? "none" : "1px solid var(--color-shelf-edge)",
      }}
    >
      {books.length === 0 && !showEmptySlot ? (
        <span className="m-auto text-[10px] italic text-paper-aged/35">
          prateleira vazia
        </span>
      ) : (
        <>
          {books.map((book) =>
            book.is_laying_down ? (
              <BookLayingDown key={book.id} book={book} mode={mode} />
            ) : (
              <BookSpine
                key={book.id}
                book={book}
                mode={mode}
                draggable={draggable}
              />
            ),
          )}
          {showEmptySlot && shelfId && (
            <EmptySlot shelfId={shelfId} position={insertPosition} />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Slot vazio "+" no fim da última prateleira da estante (modo zoom).
 *  - Click → navega pra /library/shelf/[id]/add (picker).
 *  - Drop → atribui livro arrastado àquela posição.
 */
function EmptySlot({
  shelfId,
  position,
}: {
  shelfId: string;
  position: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-${shelfId}-${position}`,
    data: { type: "book-position", shelfId, position },
  });
  return (
    <a
      ref={setNodeRef as unknown as React.Ref<HTMLAnchorElement>}
      href={`/library/shelf/${shelfId}/add`}
      className={`flex-shrink-0 h-full flex items-center justify-center text-base transition-all ${
        isOver
          ? "border-2 border-gold bg-gold/15 scale-110 text-gold"
          : "border border-dashed border-gold/30 hover:border-roasted-chestnut/60 text-gold/50 hover:text-gold animate-pulse-slow"
      }`}
      style={{ width: 40 }}
      aria-label="Adicionar livro à estante"
    >
      +
    </a>
  );
}
