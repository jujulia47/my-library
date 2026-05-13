"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Última posição do mouse em coords da viewport — usamos pra distinguir
  // mouseenter "real" (user moveu o cursor) de "induzido pelo scroll"
  // (página rolou por baixo do cursor, items passaram debaixo dele).
  // No último caso, clientX/Y do evento bate com o último registrado.
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Hover com dois timers:
  //  - dwell (1s): ao entrar, só ativa o destaque/scroll depois desse
  //    tempo — varreduras rápidas (brushing) não disparam nada.
  //  - linger (1.5s): ao sair, mantém o destaque pra dar tempo do scroll
  //    terminar e o user ver o card. Cancelado se ele entrar em outro item.
  // Se o user troca entre itens com o destaque já ativo (i.e., já passou
  // o dwell em algum), trocamos na hora — só o primeiro precisa de dwell.
  const activateHover = (id: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    // Se já tem um book destacado, troca instantâneo (modo "scanning").
    if (hoveredBookId !== null) {
      setHoveredBookId(id);
      return;
    }
    dwellTimerRef.current = setTimeout(() => {
      setHoveredBookId(id);
      dwellTimerRef.current = null;
    }, 850);
  };
  const scheduleLeave = () => {
    // Se ainda não passou o dwell, cancela e não destaca nada.
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
      return;
    }
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setHoveredBookId(null);
      leaveTimerRef.current = null;
    }, 1500);
  };
  // Threshold pequeno (3px) pra absorver jitter, mas detectar movimento real.
  const isSameMousePos = (e: { clientX: number; clientY: number }): boolean => {
    if (lastMousePosRef.current === null) return false;
    const dx = Math.abs(e.clientX - lastMousePosRef.current.x);
    const dy = Math.abs(e.clientY - lastMousePosRef.current.y);
    return dx < 3 && dy < 3;
  };
  const handleMouseEnter = (e: React.MouseEvent, id: string) => {
    if (isSameMousePos(e)) return; // scroll passou item por baixo do cursor
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    activateHover(id);
  };
  const handleMouseLeave = (e: React.MouseEvent) => {
    if (isSameMousePos(e)) return; // scroll tirou item de baixo do cursor
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    scheduleLeave();
  };
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    };
  }, []);

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
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4 pb-2 border-b border-border">
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
      <div className="relative pl-6">
        {/* Linha vertical */}
        <div
          className="absolute left-2 top-3 bottom-3 w-0.5 bg-paper-soft"
          aria-hidden
        />
        <ul className="space-y-3">
          {sortedEntries.map((entry, idx) => {
            const isHovered = hoveredBookId === entry.book_id;
            return (
              <li
                key={`${entry.book_id}-${idx}`}
                className={clsx(
                  "relative rounded-md transition-colors -mx-1 px-1 py-0.5",
                  isHovered && "bg-gold/10",
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "absolute -left-[20px] top-1 w-4 h-4 rounded-full ring-2 ring-ivory shadow-sm transition-transform",
                    DOT_CLS[entry.status],
                    isHovered && "scale-125",
                  )}
                />
                <p className="text-sm text-ink-deep">
                  <Link
                    href={`/book/${entry.book_slug}`}
                    className="font-medium hover:text-gold-deep transition-colors"
                    onMouseEnter={(e) => handleMouseEnter(e, entry.book_id)}
                    onMouseLeave={handleMouseLeave}
                    onFocus={() => activateHover(entry.book_id)}
                    onBlur={scheduleLeave}
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
