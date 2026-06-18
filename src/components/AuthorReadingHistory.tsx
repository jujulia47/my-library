"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { ReadingHistoryEntry } from "@/services/authorDetail";
import { useAuthorInteraction } from "./AuthorInteractionContext";

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

type SortMode = "recent" | "publication";

export default function AuthorReadingHistory({
  entries,
}: AuthorReadingHistoryProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const { hoveredBookId, setHoveredBookId } = useAuthorInteraction();

  // Modelo de interação: CLIQUE. Substituiu o hover (com dwell+linger+jitter
  // detection) — era complexo e disparava destaque sem o usuário querer.
  // Click: toggle determinístico. Re-clicar no mesmo item desliga; clicar em
  // outro troca pra esse outro.
  const toggleHighlight = (id: string) => {
    setHoveredBookId(hoveredBookId === id ? null : id);
  };

  const sortedEntries = useMemo(() => {
    if (sortMode === "publication") {
      // Cronológica por publicação: mais antigo primeiro. Sem ano → ao fim.
      return [...entries].sort((a, b) => {
        const ay = a.publication_year ?? 99999;
        const by = b.publication_year ?? 99999;
        if (ay !== by) return ay - by;
        return a.title.localeCompare(b.title, "pt-BR");
      });
    }
    // "recent" usa a ordem que o server já entregou: em curso primeiro,
    // depois finished/abandoned por finish_date desc.
    return entries;
  }, [entries, sortMode]);

  if (entries.length === 0) return null;

  return (
    <section className="my-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1 pb-2 border-b border-border">
        <h2 className="font-display text-xl font-medium text-ink-deep">
          Histórico de leitura
        </h2>
        <div
          className="inline-flex rounded-md border border-border bg-paper-soft text-xs"
          role="tablist"
          aria-label="Ordenação do histórico"
        >
          <button
            type="button"
            role="tab"
            aria-selected={sortMode === "recent"}
            onClick={() => setSortMode("recent")}
            className={clsx(
              "px-2.5 py-1 rounded-md transition-colors",
              sortMode === "recent"
                ? "bg-ink-deep text-ivory"
                : "text-ink-soft hover:text-ink-deep",
            )}
          >
            Mais recente
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sortMode === "publication"}
            onClick={() => setSortMode("publication")}
            className={clsx(
              "px-2.5 py-1 rounded-md transition-colors",
              sortMode === "publication"
                ? "bg-ink-deep text-ivory"
                : "text-ink-soft hover:text-ink-deep",
            )}
          >
            Por publicação
          </button>
        </div>
      </div>
      <p className="text-xs italic text-ink-fade mb-3">
        Clique numa entrada pra destacar o livro na linha do tempo.
      </p>
      <div className="relative pl-6">
        {/* Linha vertical */}
        <div
          className="absolute left-2 top-3 bottom-3 w-0.5 bg-paper-soft"
          aria-hidden
        />
        <ul className="space-y-3">
          {sortedEntries.map((entry, idx) => {
            const isActive = hoveredBookId === entry.book_id;
            return (
              <li
                key={`${entry.book_id}-${idx}`}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onClick={() => toggleHighlight(entry.book_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleHighlight(entry.book_id);
                  }
                }}
                className={clsx(
                  "relative rounded-md transition-colors -mx-1 px-1 py-0.5 cursor-pointer",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
                  isActive
                    ? "bg-gold/15"
                    : "hover:bg-paper-soft/60",
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "absolute -left-[20px] top-1 w-4 h-4 rounded-full ring-2 ring-ivory shadow-sm transition-transform",
                    DOT_CLS[entry.status],
                    isActive && "scale-125",
                  )}
                />
                <p className="text-sm text-ink-deep">
                  <Link
                    href={`/book/${entry.book_slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium hover:text-gold-deep transition-colors"
                  >
                    {entry.title}
                  </Link>
                  {entry.publication_year && sortMode === "publication" && (
                    <span className="text-ink-fade italic">
                      {" "}
                      ({entry.publication_year})
                    </span>
                  )}
                  <span className="text-ink-soft"> · {buildLabel(entry)}</span>
                </p>
                {entry.duration_days !== null && entry.status === "finished" && (
                  <p className="text-xs italic text-ink-fade mt-0.5">
                    durou {formatDuration(entry.duration_days)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
