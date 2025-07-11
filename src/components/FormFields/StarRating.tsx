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
        <label className="block text-[14px] font-medium text-[#5A3522] mb-1 ml-1">
          {label}
        </label>
      )}
      <div className="flex items-center" onMouseLeave={() => setHover(null)}>
        {[...Array(maxStars)].map((_, index) => {
          const ratingValue = index + 1;
          return (
            <button
              key={ratingValue}
              type="button"
              className={clsx(
                'text-2xl transition-colors duration-200',
                'focus:outline-none',
                (hover || value) >= ratingValue 
                  ? 'text-[#F5A623]' 
                  : 'text-[#E1D9C9]',
                hover === ratingValue && 'scale-110 transform transition-transform duration-200'
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
            className="ml-2 text-sm text-[#5A3522] hover:text-[#7F4B30] transition-colors"
            aria-label="Remover avaliação"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
};

export default StarRating;
