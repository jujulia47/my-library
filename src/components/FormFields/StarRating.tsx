"use client";

import { useState } from "react";
import clsx from "clsx";

type StarRatingProps = {
  value: number;
  onChange: (value: number) => void;
  maxStars?: number;
  className?: string;
  label?: string;
  name?: string;
};

/**
 * Star rating with half-star support. Click on the LEFT half of a star to
 * give .5; click on the RIGHT half to give the full value. Hover preview
 * mirrors the same logic — the user sees exactly what will be committed
 * before clicking.
 *
 * Visual rendering: each star is a stacked pair — a gray base and a gold
 * overlay clipped to 0/50/100% width by the current value. Lets us paint
 * half-filled stars without SVG or extra assets.
 */
export default function StarRating({
  value,
  onChange,
  maxStars = 5,
  className = "",
  label,
  name,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const displayValue = hover ?? value;

  // Calcula o fill (0, 0.5, 1) de uma estrela específica dado o rating atual.
  const fillForStar = (starIndex: number): 0 | 0.5 | 1 => {
    const diff = displayValue - starIndex;
    if (diff >= 1) return 1;
    if (diff >= 0.5) return 0.5;
    return 0;
  };

  return (
    <div className={clsx("space-y-1", className)}>
      {label && (
        <label className="block text-sm font-body font-medium text-ink-deep mb-1">
          {label}
        </label>
      )}
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: maxStars }).map((_, index) => {
          const fill = fillForStar(index);
          const baseValue = index + 1; // valor "cheio" desta estrela
          return (
            <div
              key={index}
              className="relative inline-flex text-2xl leading-none select-none cursor-pointer"
              role="presentation"
            >
              {/* Estrela base cinza */}
              <span className="text-paper-soft" aria-hidden>
                ★
              </span>
              {/* Overlay dourado, cortado de acordo com fill (0/50/100%) */}
              {fill > 0 && (
                <span
                  aria-hidden
                  className="absolute left-0 top-0 text-gold overflow-hidden pointer-events-none"
                  style={{ width: fill === 1 ? "100%" : "50%" }}
                >
                  ★
                </span>
              )}
              {/* Dois botões invisíveis sobre cada estrela: metade esquerda
                  (compromete baseValue - 0.5) e metade direita (baseValue).
                  Hover atualiza preview no mesmo formato. */}
              <button
                type="button"
                aria-label={`Avaliar com ${baseValue - 0.5} estrelas`}
                onMouseEnter={() => setHover(baseValue - 0.5)}
                onClick={() => onChange(baseValue - 0.5)}
                className="absolute left-0 top-0 h-full w-1/2 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-l"
              />
              <button
                type="button"
                aria-label={`Avaliar com ${baseValue} ${
                  baseValue === 1 ? "estrela" : "estrelas"
                }`}
                onMouseEnter={() => setHover(baseValue)}
                onClick={() => onChange(baseValue)}
                className="absolute right-0 top-0 h-full w-1/2 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-r"
              />
            </div>
          );
        })}
        <input type="hidden" name={name} value={value} />
        {value > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(0);
            }}
            className="ml-3 text-xs italic text-ink-fade hover:text-ink-deep transition-colors font-body"
            aria-label="Remover avaliação"
          >
            limpar
          </button>
        )}
      </div>
    </div>
  );
}
