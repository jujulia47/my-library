"use client";

import { useEffect, useState } from "react";
import {
  BookOpenIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import type { HomeData } from "@/services/homeData";

type Stat = {
  key: keyof HomeData["stats"] | "stars";
  label: string;
  color: string;
  fixed?: 0 | 1;
  display?: (value: number | null) => string;
};

// Sessão 17.3: cores semânticas alinhadas ao doc design-refresh:
//  - livros lidos = moss (acervo concluído)
//  - páginas = cappuccino (livro físico, neutro quente)
//  - livros/mês = gold (foco / leitura ativa)
//  - média = gold-deep (avaliação)
//  - citações = navy (metadado / informação)
//  - autores = olive (entidade orgânica)
const STATS_ORDER: Stat[] = [
  {
    key: "books_finished",
    label: "livros",
    color: "#5C6E47", // moss
    fixed: 0,
  },
  {
    key: "pages_read",
    label: "páginas",
    color: "#6B5240", // cappuccino
    fixed: 0,
  },
  {
    key: "books_per_month",
    label: "livros/mês",
    color: "#EF9F27", // gold
    fixed: 1,
  },
  {
    key: "stars",
    label: "média",
    color: "#854F0B", // gold-deep
  },
  {
    key: "quotes_count",
    label: "citações",
    color: "#1E3A5F", // navy
    fixed: 0,
  },
  {
    key: "authors_count",
    label: "autores",
    color: "#85614B", // olive
    fixed: 0,
  },
];

type Props = {
  stats: HomeData["stats"];
};

export function StatsStrip({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {STATS_ORDER.map((s) => {
        if (s.key === "stars") {
          return (
            <StatCard key="stars" stat={s} ratingValue={stats.avg_rating} />
          );
        }
        const value = stats[s.key] as number;
        return <StatCard key={s.key} stat={s} value={value} />;
      })}
    </div>
  );
}

function StatCard({
  stat,
  value,
  ratingValue,
}: {
  stat: Stat;
  value?: number;
  ratingValue?: number | null;
}) {
  const isStars = stat.key === "stars";

  return (
    <div className="stat-card group bg-paper-soft rounded-md p-3 text-center transition-colors hover:bg-paper">
      <div className="mb-1 flex justify-center min-h-[18px]">
        {isStars ? (
          <StarsRow value={ratingValue ?? null} />
        ) : (
          <StatIcon iconKey={stat.key as keyof HomeData["stats"]} color={stat.color} />
        )}
      </div>
      <p className="font-display text-2xl font-medium text-ink-deep leading-none">
        {isStars ? (
          <RatingValue value={ratingValue ?? null} />
        ) : (
          <CountUp end={value ?? 0} fixed={stat.fixed} />
        )}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-ink-fade mt-1">
        {stat.label}
      </p>
    </div>
  );
}

function StatIcon({
  iconKey,
  color,
}: {
  iconKey: keyof HomeData["stats"];
  color: string;
}) {
  const className = "w-[18px] h-[18px]";
  const style = { color };
  switch (iconKey) {
    case "books_finished":
      return <BookOpenIcon className={className} style={style} />;
    case "pages_read":
      return <DocumentTextIcon className={className} style={style} />;
    case "books_per_month":
      return <ChartBarIcon className={className} style={style} />;
    case "quotes_count":
      return <ChatBubbleLeftIcon className={className} style={style} />;
    case "authors_count":
      return <UserGroupIcon className={className} style={style} />;
    default:
      return null;
  }
}

function CountUp({
  end,
  duration = 800,
  fixed = 0,
}: {
  end: number;
  duration?: number;
  fixed?: 0 | 1;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(end)) {
      setCurrent(0);
      return;
    }
    const start = Date.now();
    let raf = 0;
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(end * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
      else setCurrent(end);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  if (fixed === 1) {
    return <>{current.toFixed(1).replace(".", ",")}</>;
  }
  return <>{Math.floor(current).toLocaleString("pt-BR")}</>;
}

function RatingValue({ value }: { value: number | null }) {
  if (value === null) return <>—</>;
  return <>{value.toFixed(1).replace(".", ",")}</>;
}

function StarsRow({ value }: { value: number | null }) {
  // 5 estrelas. Sempre renderizadas; a animação é a transição de cor
  // gerenciada via CSS no globals (group-hover .stat-card-star). Quando
  // value é null, todas ficam em cor neutra mesmo no hover.
  const total = 5;
  const filled = value === null ? 0 : Math.round(value);
  return (
    <div className="stars-row flex items-center justify-center gap-0.5 leading-none text-[13px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="stat-card-star"
          data-active={i < filled ? "true" : "false"}
          style={{ transitionDelay: `${i * 50}ms` }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
