import clsx from "clsx";

type Props = {
  /** Texto principal em CAPS — ex.: "LIDO", "5★", "FAVORITO". */
  text: string;
  /** Subtexto pequeno embaixo — ex.: "jun/26". */
  subtext?: string;
  /** "sm" = 48px, "md" = 64px. Default `md`. */
  size?: "sm" | "md";
  /** Graus de rotação. Default -10 (carimbo manchado pra esquerda). */
  rotation?: number;
  className?: string;
};

/**
 * Selo/carimbo redondo estilo "carimbo de biblioteca", em SVG.
 *
 * Vocabulário visual: dois anéis concêntricos em `cappuccino-soft`, texto em
 * caps grosso ao centro, leve falha no traço pra parecer carimbo carimbado
 * com tinta gasta. Rotação leve dá o ar de marcação manual em página de
 * diário.
 *
 * Casos de uso típicos:
 *  - `text="LIDO" subtext="jun/26"` na capa de livro finalizado
 *  - `text="5★"` ou `text="FAVORITO"` em destaques
 */
export function BookStamp({
  text,
  subtext,
  size = "md",
  rotation = -10,
  className,
}: Props) {
  const dim = size === "sm" ? 48 : 64;
  const mainFontSize = size === "sm" ? 18 : 22;
  // Sem subtexto, o texto principal sobe pro centro vertical; com subtexto
  // ele recua pra deixar espaço pra linha de baixo.
  const mainY = subtext ? 47 : 58;

  return (
    <div
      className={clsx("pointer-events-none select-none", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={dim} height={dim}>
        {/* Fundo creme semi-opaco — substrato do carimbo. Garante que o
            selo seja legível em capas claras ou escuras. */}
        <circle
          cx={50}
          cy={50}
          r={47}
          fill="var(--color-ivory-light)"
          fillOpacity={0.92}
        />
        {/* Anel externo grosso com falhas no traço — tinta gasta de carimbo. */}
        <circle
          cx={50}
          cy={50}
          r={45}
          fill="none"
          stroke="var(--color-burgundy)"
          strokeWidth={3.5}
          strokeOpacity={0.85}
          strokeDasharray="60 2"
        />
        {/* Anel interno fino, mais discreto. */}
        <circle
          cx={50}
          cy={50}
          r={37}
          fill="none"
          stroke="var(--color-burgundy)"
          strokeWidth={1}
          strokeOpacity={0.65}
        />
        <text
          x={50}
          y={mainY}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight={700}
          fontSize={mainFontSize}
          fill="var(--color-burgundy)"
          opacity={0.95}
        >
          {text}
        </text>
        {subtext && (
          <text
            x={50}
            y={64}
            textAnchor="middle"
            fontFamily="var(--font-body)"
            fontSize={11}
            fill="var(--color-burgundy)"
            opacity={0.85}
            letterSpacing="0.5"
          >
            {subtext}
          </text>
        )}
      </svg>
    </div>
  );
}
