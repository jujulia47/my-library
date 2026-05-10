'use client';

import { useState } from 'react';
import clsx from 'clsx';

type StarRatingProps = {
  value: number;
  onChange: (value: number) => void;
  maxStars?: number;
  className?: string;
  label?: string;
  name?: string;
};

const StarRating = ({
  value,
  onChange,
  maxStars = 5,
  className = '',
  label,
  name,
}: StarRatingProps) => {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-body font-medium text-ink-deep mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
        {[...Array(maxStars)].map((_, index) => {
          const ratingValue = index + 1;
          return (
            <button
              key={ratingValue}
              type="button"
              className={clsx(
                'text-2xl transition-colors duration-150 focus:outline-none',
                (hover || value) >= ratingValue ? 'text-gold' : 'text-paper-soft',
                hover === ratingValue && 'scale-110 transform transition-transform duration-150',
              )}
              onClick={() => onChange(ratingValue)}
              onMouseEnter={() => setHover(ratingValue)}
              aria-label={`Avaliar com ${ratingValue} ${ratingValue === 1 ? 'estrela' : 'estrelas'}`}
            >
              ★
            </button>
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
};

export default StarRating;
