"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import type { TopAuthor } from "@/services/homeData";

type Props = {
  data: TopAuthor[];
};

export function TopAuthors({ data }: Props) {
  const max = Math.max(...data.map((a) => a.book_count), 1);

  // Barras crescem da esquerda pra direita ao montar. Começam em 0% e
  // transicionam pro valor real após delay 300ms.
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    if (data.length === 0) return;
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <HomeCard
      title="Top autores"
      icon={<PencilIcon className="w-3.5 h-3.5" />}
    >
      {data.length === 0 ? (
        <HomeCardEmpty>Sem autores este ano.</HomeCardEmpty>
      ) : (
        <ul className="space-y-2.5">
          {data.map((author, idx) => {
            const targetWidth = (author.book_count / max) * 100;
            // Pódio com paleta saturada: 1º gold, 2º terracota, 3º burgundy,
            // demais moss. Família vintage mantida, mas sem cair em marrom.
            // Strings completas pra Tailwind JIT detectar.
            const nameColorClass =
              idx === 0
                ? "text-gold-deep"
                : idx === 1
                  ? "text-terracota"
                  : idx === 2
                    ? "text-burgundy"
                    : "text-moss";
            const barColorClass =
              idx === 0
                ? "bg-gold"
                : idx === 1
                  ? "bg-terracota"
                  : idx === 2
                    ? "bg-burgundy"
                    : "bg-moss";
            return (
              <li
                key={author.id}
                className="flex items-center gap-2 text-sm font-body"
              >
                <span
                  className={`text-[11px] font-display tabular-nums w-4 text-right ${
                    idx < 3 ? nameColorClass : "text-ink-fade"
                  }`}
                  aria-hidden
                >
                  {idx + 1}
                </span>
                <Link
                  href={`/author/${author.slug}`}
                  className={`italic flex-1 truncate hover:text-gold-deep transition-colors ${
                    idx < 3 ? nameColorClass : "text-ink-soft"
                  }`}
                  title={author.name}
                >
                  {author.name}
                </Link>
                <div
                  className="w-16 h-1.5 bg-paper-soft rounded-full overflow-hidden flex-shrink-0"
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${barColorClass}`}
                    style={{ width: `${animated ? targetWidth : 0}%` }}
                  />
                </div>
                <span className="text-xs text-ink-fade w-5 text-right tabular-nums">
                  {author.book_count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </HomeCard>
  );
}
