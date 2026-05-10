import Link from "next/link";
import {
  CheckCircleIcon,
  Squares2X2Icon,
  ArchiveBoxIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { HomeCard, HomeCardEmpty } from "@/components/Home/HomeCard";
import type { Achievement } from "@/services/yearData";

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

type Props = {
  achievements: Achievement[];
  year: number;
};

export function YearAchievements({ achievements, year }: Props) {
  // Sessão 17.10: card de conquistas usa fundo moss/10 + border-l-3 moss pra
  // sinalizar visualmente que é uma seção celebratória (verde/positivo) —
  // contraste com os cards de stats neutros em paper.
  return (
    <HomeCard
      title="Conquistas do ano"
      icon={<TrophyIcon className="w-3.5 h-3.5" />}
      iconColor="#5C6E47"
      surfaceClassName="border-l-[3px] border-l-moss border-y border-r border-paper-soft"
      style={{ background: "rgba(92, 110, 71, 0.10)" }}
    >
      {achievements.length === 0 ? (
        <HomeCardEmpty>Sem conquistas registradas este ano.</HomeCardEmpty>
      ) : (
        <ul className="divide-y divide-paper-soft">
          {achievements.map((a) => (
            <li
              key={`${a.kind}-${a.id}`}
              className="flex items-center gap-2 py-2"
            >
              {a.kind === "challenge" && (
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0 text-moss" />
              )}
              {a.kind === "series" && (
                <Squares2X2Icon className="w-4 h-4 flex-shrink-0 text-gold-deep" />
              )}
              {a.kind === "subscription" && (
                <ArchiveBoxIcon className="w-4 h-4 flex-shrink-0 text-terracota" />
              )}
              <Link
                href={
                  a.kind === "series"
                    ? `/serie/${a.slug}`
                    : `/collection/${a.slug}`
                }
                className="font-body text-sm text-ink-deep hover:text-gold-deep transition-colors line-clamp-1 min-w-0"
              >
                {a.name}
              </Link>
              <span className="ml-auto text-[11px] italic text-ink-fade flex-shrink-0">
                {a.kind === "challenge" &&
                  `concluído ${MONTH_SHORT_PT[a.completed_month - 1]}/${String(year).slice(-2)}`}
                {a.kind === "series" &&
                  `concluída ${MONTH_SHORT_PT[a.finished_month - 1]}/${String(year).slice(-2)}`}
                {a.kind === "subscription" &&
                  `${a.months_active} ${a.months_active === 1 ? "mês" : "meses"} ativos`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
