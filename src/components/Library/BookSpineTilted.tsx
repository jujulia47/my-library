"use client";

import { BookSpine } from "./BookSpine";
import { spineWidthForPages } from "@/utils/spineColors";
import type { ShelfBook } from "@/services/libraryData";
import type { LeanDirection } from "@/utils/shelfLayout";

type Props = {
  book: ShelfBook;
  leanDirection: LeanDirection;
  isSupported: boolean;
  onSpineClick?: (book: ShelfBook, rect: DOMRect) => void;
};

// Altura usada pra cálculo da margem — desktop default. Em breakpoints
// menores (180/160px), o resultado é um leve gap entre os livros (em vez
// de sobreposição), o que visualmente é mais aceitável que overlap.
const SHELF_HEIGHT = 200;
const ANGLE_DEG = 10;
const LATERAL_SHIFT = SHELF_HEIGHT * Math.sin((ANGLE_DEG * Math.PI) / 180);
const FLEX_GAP = 2;

/**
 * Lombada tombada (sessão 17.6, refinada na 17.10). Inclina 10° na direção
 * indicada por `leanDirection`. Quando o slot de suporte (vizinho na direção
 * do tombo) fica vazio, `isSupported=false` e a lombada se endireita
 * (vira standing temporário).
 *
 * Sessão 17.10:
 *  - `height: 100%` propagado pelo wrapper (antes o livro renderizava
 *    miniaturizado por conta do `inline-block` zerar a altura).
 *  - Margem dinâmica na direção do tombo igual a `H·sin(angle) - W/2 - gap`,
 *    pra que o topo do livro tombado encoste na lombada do vizinho em vez
 *    de sobrepor (como o usuário pediu: "encostado, não em cima").
 */
export function BookSpineTilted({
  book,
  leanDirection,
  isSupported,
  onSpineClick,
}: Props) {
  if (!isSupported) {
    return <BookSpine book={book} mode="wall" draggable onSpineClick={onSpineClick} />;
  }

  const spineWidth = spineWidthForPages(book.pages);
  const requiredMargin = Math.max(
    0,
    Math.round(LATERAL_SHIFT - spineWidth / 2 - FLEX_GAP),
  );

  // CSS `rotate(+α)` é horário visualmente → topo do livro vai pra direita.
  // CSS `rotate(-α)` é anti-horário → topo vai pra esquerda. Então a margem
  // tem que ser aplicada na direção pra onde o topo se desloca (não na
  // direção de `leanDirection`, que se refere ao slot de suporte e às vezes
  // está invertida em relação ao tilt visual).
  const angle = leanDirection === "right" ? -ANGLE_DEG : ANGLE_DEG;
  const tiltsRight = angle > 0;
  const marginRight = tiltsRight ? requiredMargin : 0;
  const marginLeft = !tiltsRight ? requiredMargin : 0;

  return (
    <span
      style={{
        display: "inline-block",
        // Altura alinhada com `.book-spine` wall (160). Antes era 100% pra
        // herdar do shelf-content (~182), mas isso fazia o livro inclinado
        // estourar até a prateleira de cima sem folga.
        height: 160,
        alignSelf: "flex-end",
        marginLeft,
        marginRight,
        transform: `rotateZ(${angle}deg)`,
        transformOrigin: "bottom center",
        transition: "transform 300ms ease",
      }}
    >
      <BookSpine
        book={book}
        mode="wall"
        draggable
        onSpineClick={onSpineClick}
      />
    </span>
  );
}
