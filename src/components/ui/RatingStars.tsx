import clsx from "clsx";

export type RatingStarsProps = {
  /** Rating de 0 a 5 em passos de 0.5. NULL renderiza nada. */
  value: number | null;
  /** Quantidade total de estrelas (default 5). */
  maxStars?: number;
  /** Tamanho do texto (Tailwind text-*) — default `text-base`. */
  size?: string;
  className?: string;
  /** Quando true, renderiza tooltip com o número. */
  showTitle?: boolean;
};

/**
 * Renderização visual de rating com suporte a meia-estrela.
 *
 * Cada estrela é um par stacked: base cinza + overlay dourado com
 * `clip-path` ou `width` controlado (0/50/100%). Sem SVG, sem dependências.
 */
export default function RatingStars({
  value,
  maxStars = 5,
  size = "text-base",
  className,
  showTitle = true,
}: RatingStarsProps) {
  if (value === null) return null;
  const clamped = Math.max(0, Math.min(maxStars, value));

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 leading-none select-none",
        size,
        className,
      )}
      title={showTitle ? `${clamped} de ${maxStars}` : undefined}
      aria-label={`${clamped} de ${maxStars} estrelas`}
    >
      {Array.from({ length: maxStars }).map((_, idx) => {
        const diff = clamped - idx;
        const fill = diff >= 1 ? 1 : diff >= 0.5 ? 0.5 : 0;
        return (
          <span
            key={idx}
            aria-hidden
            className="relative inline-flex"
          >
            <span className="text-paper-soft">★</span>
            {fill > 0 && (
              <span
                className="absolute left-0 top-0 text-gold overflow-hidden"
                style={{ width: fill === 1 ? "100%" : "50%" }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
