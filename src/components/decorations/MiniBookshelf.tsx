import type { CSSProperties } from "react";

/**
 * Mini ilustração de prateleira com 6 lombadas coloridas — usada como
 * ornamento decorativo (atualmente no `HomeHeader`, mas extraído pra
 * reuso). Tamanho intrínseco 56×48; props permitem override de classe /
 * estilo inline (ex.: posicionamento absoluto, opacity).
 *
 * Diferenças do `BookshelfDecoration` (em `ui/`): este é um placeholder
 * visual em paleta crua (cores hex hardcoded fora da paleta semântica do
 * design system), pensado pra ornamento sutil em headers; aquele é a peça
 * maior usada no detail page do livro, com prancha texturizada, raised
 * bands e cores via CSS variables.
 */
export function MiniBookshelf({
  className,
  style,
  width = 56,
  height = 48,
}: {
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 56 48"
      aria-hidden
      className={className}
      style={style}
    >
      {/* Paleta unificada com `BookshelfDecoration` — saturada, sem marrons
          puxando o conjunto pra apagado. 6 lombadas variando cor + altura. */}
      <rect x="6" y="20" width="6" height="22" fill="#C44A1F" rx="1" />
      <rect x="14" y="14" width="6" height="28" fill="#3B7A14" rx="1" />
      <rect x="22" y="18" width="6" height="24" fill="#1B5DB5" rx="1" />
      <rect x="30" y="10" width="6" height="32" fill="#CC8A1F" rx="1" />
      <rect x="38" y="22" width="6" height="20" fill="#B0405E" rx="1" />
      <rect x="46" y="16" width="6" height="26" fill="#5B4AB9" rx="1" />
      {/* Prateleira de madeira (gold-deep + tom mais escuro pra dar peso) */}
      <rect x="3" y="42" width="50" height="3" fill="#854F0B" />
    </svg>
  );
}
