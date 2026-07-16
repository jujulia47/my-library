"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { BookCoverFallback } from "@/components/ui";
import {
  deriveSchedule,
  formatReadingTime,
  SECONDS_PER_PAGE,
  type PlanWeek,
  type buildPlanSummary,
} from "@/utils/readingPlan";
import type { PlanBookRow } from "@/services/readingPlanData";

type Props = {
  books: PlanBookRow[];
  weeks: PlanWeek[];
  summary: ReturnType<typeof buildPlanSummary>;
  todayISO: string;
  /** Define quantas páginas de um livro ler numa semana (distribui nos dias). */
  onSetWeek: (bookId: string, days: string[], pages: number) => void;
};

/**
 * Planejamento por semana: cada semana é um card com os livros e um campo
 * "páginas essa semana". O app divide pelos dias da semana. Mostra a meta da
 * semana e quanto sobra ("livres").
 */
export default function WeeklyPlanner({
  books,
  weeks,
  summary,
  todayISO,
  onSetWeek,
}: Props) {
  const readable = books.filter(
    (b) => b.total_pages !== null && b.total_pages > 0,
  );
  // Semana atual (que contém hoje) aberta por padrão.
  const currentWeek =
    weeks.find((w) => w.days.includes(todayISO))?.index ?? 0;
  const [open, setOpen] = useState<number>(currentWeek);

  // Alocação planejada por livro (mesma do calendário).
  const schedules = new Map(
    readable.map((b) => [b.book_id, deriveSchedule(b)]),
  );
  const weekPagesFor = (bookId: string, days: string[]) => {
    const sched = schedules.get(bookId);
    if (!sched) return 0;
    return days.reduce((s, d) => s + (sched.allocations[d] ?? 0), 0);
  };

  if (readable.length === 0) {
    return (
      <p className="text-sm italic text-ink-fade py-4">
        Nenhum livro com número de páginas no plano.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {weeks.map((week) => {
        const isOpen = open === week.index;
        const isCurrent = week.index === currentWeek;
        const weekTarget = summary.dailyTarget * week.days.length;
        const weekPlanned = readable.reduce(
          (s, b) => s + weekPagesFor(b.book_id, week.days),
          0,
        );
        const free = weekTarget - weekPlanned;
        return (
          <div
            key={week.index}
            className={clsx(
              "rounded-lg border overflow-hidden",
              isCurrent
                ? "border-[#6D3914]/50 bg-[#6D3914]/[0.03]"
                : "border-border bg-ivory-light",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : week.index)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-display text-base text-ink-deep">
                  Semana {week.index + 1}
                </span>
                <span className="text-sm text-ink-fade">· {week.label}</span>
                {isCurrent && (
                  <span className="text-[11px] uppercase tracking-wider text-[#6D3914] bg-[#6D3914]/10 border border-[#6D3914]/30 rounded-full px-2 py-0.5">
                    esta semana
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm tabular-nums text-ink-soft">
                  {weekPlanned}p
                  <span className="text-ink-fade">
                    {" "}
                    / {weekTarget} meta
                  </span>
                </span>
                <ChevronDownIcon
                  className={clsx(
                    "w-4 h-4 text-ink-fade transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-border/60 pt-3">
                <ul className="space-y-2">
                  {readable.map((b) => (
                    <WeekBookRow
                      key={b.book_id}
                      book={b}
                      days={week.days}
                      current={weekPagesFor(b.book_id, week.days)}
                      onSet={(pages) => onSetWeek(b.book_id, week.days, pages)}
                    />
                  ))}
                </ul>
                <p
                  className={clsx(
                    "text-sm text-right pt-1",
                    free > 0
                      ? "text-[#6D3914]"
                      : free < 0
                        ? "text-burgundy"
                        : "text-moss",
                  )}
                >
                  {free > 0 && `${free} páginas livres nesta semana`}
                  {free < 0 && `${-free} páginas acima da meta`}
                  {free === 0 && "no ponto da meta ✓"}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekBookRow({
  book,
  days,
  current,
  onSet,
}: {
  book: PlanBookRow;
  days: string[];
  current: number;
  onSet: (pages: number) => void;
}) {
  const [draft, setDraft] = useState(current > 0 ? String(current) : "");
  const perDay = current > 0 ? Math.round(current / days.length) : 0;

  const save = () => {
    const n = draft.trim() === "" ? 0 : Number(draft);
    if (!Number.isFinite(n) || n < 0) return;
    if (n === current) return;
    onSet(n);
  };

  return (
    <li className="flex items-center gap-3">
      <div className="w-8 h-12 flex-shrink-0 relative rounded-sm overflow-hidden">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt=""
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <BookCoverFallback
            title={book.title}
            size="sm"
            className="w-full h-full"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-deep leading-tight line-clamp-1">
          {book.title}
        </p>
        {perDay > 0 && (
          <p className="text-[11px] text-ink-fade">
            ≈ {perDay} pág/dia · ~
            {formatReadingTime(perDay * SECONDS_PER_PAGE)}/dia
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="number"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="0"
          className="w-20 rounded border border-border bg-paper-soft px-2 py-1.5 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-1 focus:ring-[#6D3914]/30 outline-none text-center"
        />
        <span className="text-[11px] text-ink-fade w-14">pág/sem</span>
      </div>
    </li>
  );
}
