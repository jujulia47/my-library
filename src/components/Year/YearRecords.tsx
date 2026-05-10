import Link from "next/link";
import { HomeCard, HomeCardEmpty } from "@/components/Home/HomeCard";
import {
  TrophyIcon,
  BookOpenIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import type { YearData } from "@/services/yearData";

const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type Props = {
  records: YearData["records"];
};

/**
 * Sessão 17.10: cards de records ganham border-l-3 colorida + ícone
 * circular semântico. Mantém o grid 3 colunas (1 col em mobile).
 *
 * Mapeamento (alinhado ao spec da 17.10):
 *  - Melhor mês  → TrophyIcon, gold-deep (recorde/triunfo)
 *  - Mais longo  → BookOpenIcon, burgundy (peso/dedicação)
 *  - Mais rápido → BoltIcon, moss (energia/velocidade)
 */
export function YearRecords({ records }: Props) {
  const allEmpty =
    !records.best_month && !records.longest_book && !records.fastest_book;
  if (allEmpty) {
    return (
      <HomeCard title="Recordes" iconColor="#EF9F27">
        <HomeCardEmpty>
          Recordes aparecem aqui depois de finalizar leituras com data.
        </HomeCardEmpty>
      </HomeCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <RecordCard
        Icon={TrophyIcon}
        accent="gold-deep"
        label="Melhor mês"
        value={
          records.best_month
            ? MONTH_NAMES_PT[records.best_month.month - 1]
            : "—"
        }
        subtitle={
          records.best_month
            ? `${records.best_month.book_count} ${
                records.best_month.book_count === 1 ? "livro" : "livros"
              } · ${records.best_month.page_count.toLocaleString("pt-BR")} páginas`
            : "Sem dados"
        }
      />
      <RecordCard
        Icon={BookOpenIcon}
        accent="burgundy"
        label="Mais longo"
        value={records.longest_book?.title ?? "—"}
        subtitle={
          records.longest_book
            ? `${records.longest_book.days} ${
                records.longest_book.days === 1 ? "dia" : "dias"
              }`
            : "Sem dados"
        }
        href={
          records.longest_book ? `/book/${records.longest_book.slug}` : null
        }
      />
      <RecordCard
        Icon={BoltIcon}
        accent="moss"
        label="Mais rápido"
        value={records.fastest_book?.title ?? "—"}
        subtitle={
          records.fastest_book
            ? `${records.fastest_book.days} ${
                records.fastest_book.days === 1 ? "dia" : "dias"
              }`
            : "Sem dados"
        }
        href={
          records.fastest_book ? `/book/${records.fastest_book.slug}` : null
        }
      />
    </div>
  );
}

type Accent = "gold-deep" | "burgundy" | "moss";

const ACCENT_CLASSES: Record<Accent, { border: string; text: string }> = {
  "gold-deep": {
    border: "border-l-gold-deep",
    text: "text-gold-deep",
  },
  burgundy: {
    border: "border-l-burgundy",
    text: "text-burgundy",
  },
  moss: {
    border: "border-l-moss",
    text: "text-moss",
  },
};

function RecordCard({
  Icon,
  accent,
  label,
  value,
  subtitle,
  href,
}: {
  Icon: typeof TrophyIcon;
  accent: Accent;
  label: string;
  value: string;
  subtitle: string;
  href?: string | null;
}) {
  const styles = ACCENT_CLASSES[accent];
  const inner = (
    <div
      className={`record-card bg-paper border border-paper-soft border-l-[3px] ${styles.border} rounded-r-lg rounded-l-sm p-4 flex flex-col h-full transition-colors hover:bg-paper-soft`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${styles.text}`} aria-hidden />
        <span className="text-xs uppercase tracking-wider text-ink-fade">
          {label}
        </span>
      </div>
      <p className="font-display text-lg leading-tight text-ink-deep line-clamp-2">
        {value}
      </p>
      <p className="text-xs italic text-ink-fade mt-1">{subtitle}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
