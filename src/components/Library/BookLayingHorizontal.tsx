"use client";

import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import {
  layingThicknessForPages,
  spineHexForBookId,
} from "@/utils/spineColors";
import { useBookHover } from "./useBookHover";
import type { ShelfBook } from "@/services/libraryData";

type Props = {
  book: ShelfBook;
  onSpineClick?: (book: ShelfBook, rect: DOMRect) => void;
};

/**
 * Sessão 17.8: lombada deitada (cluster `laying-stack`). Sessão 17.10:
 *  - Espessura proporcional a `book.pages` (via `layingThicknessForPages`).
 *  - Toda a estilização da spine standing rotacionada 90°: dois "raised
 *    bands" verticais (::before/::after a 22% e 78% da largura), frisos
 *    dourados nas pontas (.laying-friso left/right) e título centralizado
 *    com efeito gold-foil.
 *  - Hover tooltip via portal (igual ao da spine standing).
 */
export function BookLayingHorizontal({ book, onSpineClick }: Props) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: book.id,
    data: { type: "book", book },
  });

  const opacity = book.ownership_status === "lent_out" ? 0.4 : 1;
  const titleAttr = `${book.title}${
    book.author_name ? ` — ${book.author_name}` : ""
  }`;
  const hex = spineHexForBookId(book.id);
  const thickness = layingThicknessForPages(book.pages);
  const showTitle = thickness >= 14;

  const { handlers: hoverHandlers, tooltip: hoverTooltip } =
    useBookHover(titleAttr);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      {...hoverHandlers}
      title={titleAttr}
      className="book-laying-horizontal"
      style={{
        height: thickness,
        background: `linear-gradient(180deg, ${hex} 0%, ${darken(hex, 22)} 50%, ${darken(hex, 8)} 100%)`,
        opacity: isDragging ? 0.3 : opacity,
      }}
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
          return;
        }
        if (onSpineClick) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          onSpineClick(book, rect);
          return;
        }
        router.push(`/library/book/${book.slug}`);
      }}
    >
      <span aria-hidden className="laying-friso left" />
      <span aria-hidden className="laying-friso right" />
      {showTitle && <span className="laying-title">{book.title}</span>}
      {hoverTooltip}
    </div>
  );
}

function darken(hex: string, percent: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const factor = 1 - percent / 100;
  const r2 = Math.max(0, Math.round(r * factor));
  const g2 = Math.max(0, Math.round(g * factor));
  const b2 = Math.max(0, Math.round(b * factor));
  return `#${r2.toString(16).padStart(2, "0")}${g2.toString(16).padStart(2, "0")}${b2.toString(16).padStart(2, "0")}`;
}
