"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/forms/Modal";

const MONTH_LETTERS = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
];

const MONTH_FULL = [
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

type MonthData = {
  month: number;
  count: number;
  books: { id: string; slug: string; title: string; finish_date: string }[];
};

type Props = {
  data: MonthData[];
  currentMonth: number; // 1..12
};

function formatFinishDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function BooksPerMonthChart({ data, currentMonth }: Props) {
  const [openMonth, setOpenMonth] = useState<MonthData | null>(null);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalRead = data
    .filter((d) => d.month <= currentMonth)
    .reduce((sum, d) => sum + d.count, 0);
  const monthsElapsed = Math.max(1, currentMonth);
  const avgPerMonth = (totalRead / monthsElapsed).toFixed(1).replace(".", ",");

  return (
    <>
      <div className="bg-paper border border-paper-soft rounded-lg p-3.5 h-full">
        <div className="flex justify-between items-baseline mb-2.5">
          <p className="text-xs font-body font-medium text-ink-deep uppercase tracking-wider">
            Livros por mês
          </p>
          <span className="text-[10px] italic text-ink-fade">
            média {avgPerMonth}/mês
          </span>
        </div>

        <div
          className="grid grid-cols-12 gap-1 items-end"
          style={{ height: 64 }}
        >
          {data.map((entry, idx) => {
            const isFuture = entry.month > currentMonth;
            const isCurrent = entry.month === currentMonth;
            const heightPct =
              entry.count > 0
                ? (entry.count / maxCount) * 100
                : isFuture
                  ? 0
                  : 14;
            const barGradient = isCurrent
              ? "linear-gradient(180deg, var(--color-navy-soft) 0%, var(--color-navy) 100%)"
              : "linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)";
            const isClickable = entry.count > 0;
            const monthLabel = MONTH_FULL[entry.month - 1];
            return (
              <button
                key={entry.month}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && setOpenMonth(entry)}
                aria-label={
                  isClickable
                    ? `Ver ${entry.count} ${entry.count === 1 ? "livro" : "livros"} de ${monthLabel}`
                    : `${monthLabel}: sem livros`
                }
                className={`flex flex-col items-center gap-0.5 h-full justify-end transition-transform ${
                  isClickable ? "cursor-pointer hover:scale-105" : "cursor-default"
                }`}
              >
                <span
                  className={`text-[10px] leading-none font-mono tabular-nums ${
                    entry.count > 0 ? "text-ink-soft" : "text-ink-fade/60"
                  }`}
                >
                  {entry.count > 0 ? entry.count : ""}
                </span>
                {!isFuture && (
                  <div
                    className="rounded-t origin-bottom w-full max-w-[18px]"
                    style={{
                      height: `${heightPct}%`,
                      background: barGradient,
                      transform: "scaleY(0)",
                      animation: `barGrow 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${
                        idx * 50
                      }ms forwards`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-1 mt-1.5">
          {MONTH_LETTERS.map((m, i) => {
            const isCurrent = i + 1 === currentMonth;
            return (
              <span
                key={i}
                className={`text-[9px] text-center font-body ${
                  isCurrent
                    ? "text-ink-deep font-medium"
                    : i + 1 > currentMonth
                      ? "text-ink-fade/60"
                      : "text-ink-fade"
                }`}
              >
                {m}
              </span>
            );
          })}
        </div>
      </div>

      <Modal
        open={openMonth !== null}
        onClose={() => setOpenMonth(null)}
        title={
          openMonth
            ? `${MONTH_FULL[openMonth.month - 1]} · ${openMonth.count} ${openMonth.count === 1 ? "livro" : "livros"}`
            : ""
        }
        size="sm"
      >
        {openMonth && (
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
            {openMonth.books.map((book) => (
              <li
                key={book.id}
                className="flex items-baseline justify-between gap-3 py-1.5 border-b border-border last:border-b-0"
              >
                <Link
                  href={`/book/${book.slug}`}
                  className="font-body text-sm text-ink-deep hover:text-gold-deep transition-colors flex-1 min-w-0"
                >
                  {book.title}
                </Link>
                <span className="font-mono text-[11px] text-ink-fade flex-shrink-0">
                  {formatFinishDate(book.finish_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
