"use client";

import { useEffect, useState } from "react";
import {
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import type { RatingBucket } from "@/services/homeData";

type Props = {
  data: RatingBucket[];
};

export function RatingDistribution({ data }: Props) {
  const max = Math.max(...data.map((b) => b.count), 1);
  const total = data.reduce((acc, b) => acc + b.count, 0);

  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    if (total === 0) return;
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, [total]);

  return (
    <HomeCard
      title="Notas dadas"
      icon={<StarSolidIcon className="w-3.5 h-3.5" />}
    >
      {total === 0 ? (
        <HomeCardEmpty>Sem livros avaliados este ano.</HomeCardEmpty>
      ) : (
        <ul className="space-y-2">
          {data.map((bucket) => {
            const targetWidth =
              bucket.count > 0 ? (bucket.count / max) * 100 : 0;
            // Sessão 17.3: barra colorida por nota — dá leitura imediata
            // do "shape" das avaliações (5★ gold-deep, 1★ ink-fade neutro).
            const barColor =
              bucket.rating === 5
                ? "bg-gold-deep"
                : bucket.rating === 4
                  ? "bg-gold"
                  : bucket.rating === 3
                    ? "bg-cappuccino"
                    : bucket.rating === 2
                      ? "bg-cappuccino-soft"
                      : "bg-ink-fade";
            return (
              <li
                key={bucket.rating}
                className="flex items-center gap-3 text-sm"
              >
                <div className="flex gap-0.5 flex-shrink-0" aria-hidden>
                  {Array.from({ length: 5 }).map((_, idx) =>
                    idx < bucket.rating ? (
                      <StarSolidIcon
                        key={idx}
                        className="w-3 h-3 text-gold"
                      />
                    ) : (
                      <StarOutlineIcon
                        key={idx}
                        className="w-3 h-3 text-paper-soft"
                      />
                    ),
                  )}
                </div>
                <div
                  className="flex-1 h-1.5 bg-paper-soft rounded-full overflow-hidden"
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
                    style={{ width: `${animated ? targetWidth : 0}%` }}
                  />
                </div>
                <span className="text-xs text-ink-fade w-5 text-right tabular-nums">
                  {bucket.count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </HomeCard>
  );
}
