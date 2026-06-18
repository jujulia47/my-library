import Link from "next/link";
import clsx from "clsx";
import type {
  SeriesTrackerEntry,
  SeriesVolumeEntry,
} from "@/services/yearData";

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

function formatVolumeLabel(volume: number | null): string {
  if (volume === null) return "·";
  return Number.isInteger(volume) ? String(volume) : volume.toString();
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()}/${MONTH_SHORT_PT[d.getUTCMonth()]}/${String(d.getUTCFullYear()).slice(-2)}`;
}

type Props = {
  trackers: SeriesTrackerEntry[];
};

/**
 * Tracker das séries que tiveram pelo menos um volume terminado no ano.
 * Cada série vira um cartão com header (nome + stats) e uma fileira de
 * "casinhas" numeradas, uma por volume. Volumes lidos *neste ano* ganham
 * destaque (preenchimento mais saturado + borda 2px); lidos em anos passados
 * ficam discretos; não-lidos ficam vazios.
 */
export function YearSeriesTracker({ trackers }: Props) {
  if (trackers.length === 0) return null;

  return (
    <section className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
      {trackers.map((t) => (
        <SeriesRow key={t.serie_id} tracker={t} />
      ))}
    </section>
  );
}

function SeriesRow({ tracker }: { tracker: SeriesTrackerEntry }) {
  const {
    serie_slug,
    serie_name,
    qty_volumes,
    volumes,
    registered_count,
    read_this_year_count,
    total_read_count,
  } = tracker;

  // Slots vazios extras quando o user diz que a série tem mais volumes que
  // ele cadastrou (qty_volumes > registered_count).
  const totalSlots = qty_volumes ?? registered_count;
  const extraEmpty = Math.max(0, totalSlots - registered_count);

  return (
    <article className="bg-paper border border-paper-soft rounded-lg p-4">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-3">
        <Link
          href={`/serie/${serie_slug}`}
          className="font-display text-base text-ink-deep hover:text-gold-deep transition-colors"
        >
          {serie_name}
        </Link>
        <p className="text-xs italic text-ink-fade">
          {total_read_count} de {qty_volumes ?? registered_count} lidos
          {read_this_year_count > 0 && (
            <>
              {" "}
              ·{" "}
              <span className="text-gold-deep not-italic font-medium">
                {read_this_year_count} este ano
              </span>
            </>
          )}
        </p>
      </header>

      <div className="flex flex-wrap gap-2.5">
        {volumes.map((v) => (
          <VolumeCell key={v.book_id} volume={v} />
        ))}
        {Array.from({ length: extraEmpty }, (_, i) => {
          const ordinal = registered_count + i + 1;
          return (
            <div
              key={`empty-${ordinal}`}
              className="w-14 h-14 rounded-md border border-dashed border-ink-fade/30 flex items-center justify-center text-sm font-body text-ink-fade/50"
              title={`volume ${ordinal} ainda não cadastrado`}
            >
              {ordinal}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function VolumeCell({ volume }: { volume: SeriesVolumeEntry }) {
  const label = formatVolumeLabel(volume.volume_number);

  const tooltipParts = [
    volume.volume_number !== null ? `vol. ${label}` : null,
    volume.book_title,
    volume.finish_date ? `lido em ${formatShortDate(volume.finish_date)}` : null,
  ].filter(Boolean);
  const tooltip = tooltipParts.join(" · ");

  // Mesmo tamanho do grid de livros do ano (56×56) pra manter a linguagem
  // visual coerente entre os dois trackers.
  const baseClasses =
    "w-14 h-14 flex-shrink-0 rounded-md flex items-center justify-center text-sm font-body font-medium relative transition-transform hover:scale-110 hover:shadow-sm";

  const stylesByStatus: Record<SeriesVolumeEntry["status"], string> = {
    // Destaque máximo: lido neste ano. Borda mais grossa + tint mais
    // saturado pra "saltar" no meio da fileira.
    read_this_year: "bg-gold/40 border-2 border-gold-deep text-ink-deep",
    // Lido em anos passados — presente mas sem chamar atenção.
    read_other_year: "bg-gold/15 border border-gold/40 text-ink-deep",
    in_progress: "bg-terracota/20 border border-terracota/60 text-ink-deep",
    paused: "bg-olive/20 border border-olive/60 text-ink-deep",
    abandoned: "bg-burgundy/15 border border-burgundy/50 text-burgundy",
    not_read: "bg-paper-soft border border-ink-fade/30 text-ink-fade",
  };

  return (
    <Link
      href={`/book/${volume.book_slug}`}
      title={tooltip}
      aria-label={tooltip}
      className={clsx(baseClasses, stylesByStatus[volume.status])}
    >
      {label}
    </Link>
  );
}
