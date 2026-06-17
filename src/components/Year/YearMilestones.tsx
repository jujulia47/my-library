import Link from "next/link";
import {
  StarIcon,
  BookOpenIcon,
  DocumentTextIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { HomeCard, HomeCardEmpty } from "@/components/Home/HomeCard";
import type { Milestone } from "@/services/yearData";

const MONTH_SHORT_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function formatShort(date: string, year: number): string {
  const d = new Date(date);
  const month = MONTH_SHORT_PT[d.getUTCMonth()] ?? "";
  const day = d.getUTCDate();
  return `${day}/${month}/${String(year).slice(-2)}`;
}

type Props = {
  milestones: Milestone[];
  year: number;
};

/**
 * Marcos de leitura do ano. Substitui o card "Conquistas" (que misturava
 * coleções/séries/assinaturas). Lista os pontos numéricos cruzados — 10º
 * livro, 10k páginas, primeira 5★ — em ordem cronológica.
 */
export function YearMilestones({ milestones, year }: Props) {
  return (
    <HomeCard
      title="Marcos de leitura"
      icon={<TrophyIcon className="w-3.5 h-3.5" />}
      iconColor="#5C6E47"
      surfaceClassName="border-l-[3px] border-l-moss border-y border-r border-paper-soft"
      style={{ background: "rgba(92, 110, 71, 0.10)" }}
    >
      {milestones.length === 0 ? (
        <HomeCardEmpty>Sem marcos atingidos este ano ainda.</HomeCardEmpty>
      ) : (
        <ul className="divide-y divide-paper-soft">
          {milestones.map((m, idx) => (
            <li
              key={`${m.kind}-${idx}`}
              className="flex items-center gap-2 py-2"
            >
              {m.kind === "books" && (
                <BookOpenIcon className="w-4 h-4 flex-shrink-0 text-moss" />
              )}
              {m.kind === "pages" && (
                <DocumentTextIcon className="w-4 h-4 flex-shrink-0 text-gold-deep" />
              )}
              {m.kind === "first_five_star" && (
                <StarIcon className="w-4 h-4 flex-shrink-0 text-gold" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-ink-deep leading-tight line-clamp-1">
                  {m.label}
                </p>
                <Link
                  href={`/book/${m.book_slug}`}
                  className="font-body text-xs italic text-ink-fade hover:text-gold-deep transition-colors line-clamp-1"
                >
                  {m.book_title}
                </Link>
              </div>
              <span className="text-[11px] italic text-ink-fade flex-shrink-0">
                {formatShort(m.date, year)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
