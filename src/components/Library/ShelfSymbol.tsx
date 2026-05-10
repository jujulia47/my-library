import type { ShelfSymbol as Symbol } from "@/services/libraryData";

type Props = {
  symbol: Symbol;
  size?: number;
  className?: string;
};

/**
 * 8 ícones decorativos pra topo da estante. Desenho dourado com glow sutil
 * (drop-shadow) — pretende lembrar relevo gravado em madeira de marcenaria
 * antiga. SVGs simples, viewBox 24×24, stroke ouro.
 */
export function ShelfSymbol({ symbol, size = 22, className }: Props) {
  return (
    <span
      className={className}
      style={{
        color: "#F0C040",
        filter: "drop-shadow(0 0 6px rgba(240,192,64,0.45))",
        display: "inline-flex",
        lineHeight: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {RENDERERS[symbol]}
      </svg>
    </span>
  );
}

// =============================================================================
// Path renderers — cada símbolo é um pequeno desenho.
// =============================================================================

const RENDERERS: Record<Symbol, React.ReactNode> = {
  // Lua crescente clássica
  moon: (
    <path d="M 18 4 A 9 9 0 1 0 18 20 A 7 7 0 0 1 18 4 Z" />
  ),

  // Sol — círculo central + 8 raios
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="7" y2="7" />
      <line x1="17" y1="17" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="7" y2="17" />
      <line x1="17" y1="7" x2="19.1" y2="4.9" />
    </>
  ),

  // Pena — lembra a versão escrita à mão
  feather: (
    <>
      <path d="M 17 4 Q 9 8 7 16 Q 6 19 5 21" />
      <path d="M 17 4 Q 11 5 9 9" opacity="0.7" />
      <path d="M 17 4 Q 13 8 11 13" opacity="0.7" />
      <path d="M 7 16 L 11 16" />
    </>
  ),

  // Chave antiga — corpo + dentes
  key: (
    <>
      <circle cx="7" cy="12" r="3.5" />
      <line x1="10.5" y1="12" x2="20" y2="12" />
      <line x1="20" y1="12" x2="20" y2="15" />
      <line x1="17" y1="12" x2="17" y2="14" />
      <circle cx="7" cy="12" r="1" />
    </>
  ),

  // Rosa estilizada
  rose: (
    <>
      <path d="M 12 3 Q 8 6 8 10 Q 8 13 12 13 Q 16 13 16 10 Q 16 6 12 3 Z" />
      <path d="M 12 7 Q 11 9 12 11 Q 13 9 12 7 Z" />
      <path d="M 12 13 Q 12 17 9 19" />
      <path d="M 12 13 Q 12 17 15 19" opacity="0.7" />
      <path d="M 12 13 L 12 21" />
    </>
  ),

  // Coroa — 3 pontas + base
  crown: (
    <>
      <path d="M 3 18 L 3 9 L 7 12 L 12 6 L 17 12 L 21 9 L 21 18 Z" />
      <line x1="3" y1="20" x2="21" y2="20" />
      <circle cx="12" cy="6" r="1" fill="currentColor" />
    </>
  ),

  // Estrela 5 pontas
  star: (
    <path d="M 12 2 L 14.5 9 L 22 9 L 16 13.5 L 18.5 21 L 12 16.5 L 5.5 21 L 8 13.5 L 2 9 L 9.5 9 Z" />
  ),

  // Chama — silhueta de fogo
  flame: (
    <>
      <path d="M 12 3 Q 7 8 7 13 Q 7 18 12 21 Q 17 18 17 13 Q 17 9 14 6 Q 14 9 12 11 Q 11 8 12 3 Z" />
      <path d="M 12 14 Q 10 16 10 18 Q 11 19 12 19 Q 13 19 14 18 Q 14 16 12 14 Z" opacity="0.7" />
    </>
  ),
};
