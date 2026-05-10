import Link from "next/link";
import clsx from "clsx";
import type { ReadingHistoryEntry } from "@/services/authorDetail";

function formatMonthYear(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const m = d.toLocaleDateString("pt-BR", {
    month: "short",
    timeZone: "UTC",
  });
  return `${m.replace(".", "")}/${d.getUTCFullYear()}`;
}

function formatDuration(days: number): string {
  if (days < 1) return "menos de 1 dia";
  if (days === 1) return "1 dia";
  if (days < 30) return `${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 mês";
  if (months < 12) return `${months} meses`;
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days - years * 365) / 30);
  if (years === 1 && remMonths === 0) return "1 ano";
  if (remMonths === 0) return `${years} anos`;
  return `${years} ${years === 1 ? "ano" : "anos"} e ${remMonths} ${remMonths === 1 ? "mês" : "meses"}`;
}

const DOT_CLS: Record<ReadingHistoryEntry["status"], string> = {
  finished: "bg-moss",
  reading: "bg-gold",
  paused: "bg-ink-fade",
  abandoned: "bg-burgundy",
};

function buildLabel(entry: ReadingHistoryEntry): string {
  const pct =
    entry.current_page && entry.pages_count
      ? Math.min(100, Math.round((entry.current_page / entry.pages_count) * 100))
      : null;
  switch (entry.status) {
    case "finished": {
      const when = formatMonthYear(entry.finished_at);
      const stars = entry.rating ? ` · ${entry.rating}★` : "";
      return when ? `concluído em ${when}${stars}` : `concluído${stars}`;
    }
    case "reading": {
      const when = formatMonthYear(entry.started_at);
      const progress = pct !== null ? ` · ${pct}%` : "";
      return when ? `lendo desde ${when}${progress}` : `lendo${progress}`;
    }
    case "paused": {
      const when = formatMonthYear(entry.started_at);
      const progress =
        entry.current_page && entry.pages_count
          ? ` · pág ${entry.current_page}/${entry.pages_count}`
          : "";
      return when ? `pausado desde ${when}${progress}` : `pausado${progress}`;
    }
    case "abandoned": {
      const when = formatMonthYear(entry.finished_at);
      return when ? `abandonado em ${when}` : "abandonado";
    }
    default:
      return "";
  }
}

export type AuthorReadingHistoryProps = {
  entries: ReadingHistoryEntry[];
};

export default function AuthorReadingHistory({
  entries,
}: AuthorReadingHistoryProps) {
  if (entries.length === 0) return null;

  return (
    <section className="my-10">
      <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-2 border-b border-border">
        Histórico de leitura
      </h2>
      <div className="relative pl-6">
        {/* Linha vertical */}
        <div
          className="absolute left-2 top-3 bottom-3 w-0.5 bg-paper-soft"
          aria-hidden
        />
        <ul className="space-y-3">
          {entries.map((entry, idx) => (
            <li
              key={`${entry.book_id}-${idx}`}
              className="relative"
            >
              <span
                aria-hidden
                className={clsx(
                  "absolute -left-[20px] top-1 w-4 h-4 rounded-full ring-2 ring-ivory shadow-sm",
                  DOT_CLS[entry.status],
                )}
              />
              <p className="text-sm text-ink-deep">
                <Link
                  href={`/book/${entry.book_slug}`}
                  className="font-medium hover:text-gold-deep transition-colors"
                >
                  {entry.title}
                </Link>
                <span className="text-ink-soft"> · {buildLabel(entry)}</span>
              </p>
              {entry.duration_days !== null && entry.status === "finished" && (
                <p className="text-xs italic text-ink-fade mt-0.5">
                  durou {formatDuration(entry.duration_days)}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
