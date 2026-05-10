"use client";

import Link from "next/link";
import type { ShelfBook } from "@/services/libraryData";

type Mode = "mini" | "zoom";

type Props = {
  book: ShelfBook;
  mode: Mode;
};

function lighten(hex: string, percent: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const factor = percent / 100;
  const r2 = Math.min(255, Math.round(r + (255 - r) * factor));
  const g2 = Math.min(255, Math.round(g + (255 - g) * factor));
  const b2 = Math.min(255, Math.round(b + (255 - b) * factor));
  return `#${r2.toString(16).padStart(2, "0")}${g2.toString(16).padStart(2, "0")}${b2.toString(16).padStart(2, "0")}`;
}

/**
 * Livro deitado horizontalmente — uma "pilha" de uma camada só. Largura é
 * 70% da spine_width (livro deitado ocupa menos no eixo horizontal porque
 * vira 90°).
 *
 * Por simplicidade da 16.2, livros deitados NÃO são draggable. Eles ficam
 * fixos onde caíram pelo `computeIsLayingDown(book.id)` (~12.5%). Click
 * ainda navega.
 */
export function BookLayingDown({ book, mode }: Props) {
  const isMini = mode === "mini";
  const width = Math.round(book.spine_width * 0.7);
  const stackHeight = isMini ? 5 : 9;
  // lent_out (emprestado pra alguém) → esmaecido. Sessão 17.2 trocou
  // `physical_status === "emprestado"` por `ownership_status === "lent_out"`.
  const opacity = book.ownership_status === "lent_out" ? 0.4 : 1;
  const href = isMini
    ? `/book/${book.slug}`
    : `/library/book/${book.slug}`;

  return (
    <Link
      href={href}
      title={`${book.title}${book.author_name ? ` — ${book.author_name}` : ""} (deitado)`}
      className="self-end shadow-stack rounded-[1px] hover:scale-[1.04] transition-transform"
      style={{
        width,
        height: stackHeight,
        background: `linear-gradient(90deg, ${book.spine_color} 0%, ${lighten(
          book.spine_color,
          18,
        )} 100%)`,
        opacity,
        marginBottom: 1,
      }}
    />
  );
}
