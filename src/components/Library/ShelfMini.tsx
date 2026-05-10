"use client";

import Link from "next/link";
import { ShelfSymbol } from "./ShelfSymbol";
import { ShelfContent } from "./ShelfContent";
import type { Shelf } from "@/services/libraryData";

const ARCH_HEIGHT = 72;
const BODY_HEIGHT = 460;
const WIDTH = 280;
const PLATE_HEIGHT = 56;
// Largura útil dentro da estante — descontados pilares laterais (~10px cada).
const INNER_WIDTH = WIDTH - 32;

type Props = {
  shelf: Shelf;
};

export function ShelfMini({ shelf }: Props) {
  return (
    <Link
      href={`/library/shelf/${shelf.id}`}
      className="flex-shrink-0 group cursor-pointer"
      style={{ width: WIDTH }}
      aria-label={`Estante ${shelf.symbol} — ${shelf.total_books} livros`}
    >
      <div className="transition-transform duration-200 group-hover:-translate-y-1">
        {/* Arco superior */}
        <div
          className="border border-b-0 rounded-t-[140px] flex items-start justify-center pt-3 shadow-shelf-inset"
          style={{
            height: ARCH_HEIGHT,
            background: "var(--color-shelf-arch)",
            borderColor: "var(--color-shelf-border)",
          }}
        >
          <ShelfSymbol symbol={shelf.symbol} size={22} />
        </div>

        {/* Corpo da estante */}
        <div
          className="relative border border-t-0 shadow-shelf-inset"
          style={{
            height: BODY_HEIGHT,
            background: "var(--color-shelf-body)",
            borderColor: "var(--color-shelf-border)",
          }}
        >
          {/* Pilar esquerdo */}
          <div
            aria-hidden
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: 10,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 100%)",
            }}
          />
          {/* Pilar direito */}
          <div
            aria-hidden
            className="absolute right-0 top-0 bottom-0"
            style={{
              width: 10,
              background:
                "linear-gradient(270deg, rgba(0,0,0,0.4) 0%, transparent 100%)",
            }}
          />

          <ShelfContent
            books={shelf.books}
            mode="mini"
            availableWidth={INNER_WIDTH}
            plateHeight={PLATE_HEIGHT}
          />

          {/* Contador no rodapé */}
          <span className="absolute bottom-2 right-3 text-[11px] italic text-paper-aged/70 z-10">
            {shelf.total_books}{" "}
            {shelf.total_books === 1 ? "livro" : "livros"}
          </span>
        </div>
      </div>
    </Link>
  );
}
