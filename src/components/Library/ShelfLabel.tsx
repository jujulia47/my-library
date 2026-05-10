"use client";

import { ShelfSymbol } from "./ShelfSymbol";
import type { ShelfSymbol as Symbol } from "@/services/libraryData";

type Props = {
  symbol: Symbol;
  bookCount: number;
  onClick?: () => void;
};

/**
 * Label da seção à esquerda da prateleira (sessão 17.4) — ícone + count
 * em font-display dourado. Click expande a vista zoom (state-driven).
 */
export function ShelfLabel({ symbol, bookCount, onClick }: Props) {
  const countLabel = `${bookCount} ${bookCount === 1 ? "livro" : "livros"}`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Expandir estante (${countLabel})`}
      className="absolute left-2 bottom-6 w-12 flex flex-col items-center gap-1 z-10 group"
    >
      <span className="transition-transform group-hover:scale-110">
        <ShelfSymbol symbol={symbol} size={28} />
      </span>
      <span className="font-display italic text-[10px] text-gold-deep group-hover:text-gold leading-tight max-w-[60px] text-center">
        {countLabel}
      </span>
    </button>
  );
}
