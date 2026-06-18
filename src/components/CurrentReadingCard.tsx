"use client";

import Link from "next/link";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import { BookCoverFallback } from "@/components/ui";

export type CurrentReadingItem = {
  reading_id: string;
  current_page: number | null;
  start_date: string | null;
  book: {
    id: string;
    title: string;
    slug: string;
    cover: string | null;
    pages: number | null;
    authors: string[];
  };
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
});
const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatStartDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const currentYear = new Date().getUTCFullYear();
  if (d.getUTCFullYear() === currentYear) {
    return monthFormatter.format(d);
  }
  return monthYearFormatter.format(d);
}

export default function CurrentReadingCard({
  item,
}: {
  item: CurrentReadingItem;
}) {
  const { book, current_page, start_date } = item;
  const hasProgress =
    typeof current_page === "number" &&
    typeof book.pages === "number" &&
    book.pages > 0;
  const percent = hasProgress
    ? Math.min(100, Math.round((current_page! / book.pages!) * 100))
    : 0;
  const startedLabel = formatStartDate(start_date);
  const author = book.authors[0] ?? null;
  const moreAuthors = book.authors.length > 1 ? book.authors.length - 1 : 0;

  return (
    <Link
      href={`/book/${book.slug}`}
      className="flex gap-4 p-3 rounded-lg hover:bg-paper-soft transition-colors duration-150"
    >
      <div className="flex-shrink-0 w-20" style={{ aspectRatio: "2 / 3" }}>
        <div className="relative w-full h-full">
          <BookCoverFallback
            title={book.title}
            size="sm"
            className="w-full h-full"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-display text-base font-medium text-ink-deep leading-tight line-clamp-2">
          {book.title}
        </h3>
        {author && (
          <p className="font-body text-[13px] italic text-ink-fade truncate">
            {author}
            {moreAuthors > 0 && ` +${moreAuthors}`}
          </p>
        )}

        {hasProgress && (
          <div className="mt-2 h-[3px] w-full bg-paper-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        <p className="mt-1.5 text-xs text-ink-fade font-body inline-flex items-center gap-1 flex-wrap">
          {hasProgress && (
            <span className="inline-flex items-center gap-1">
              <BookmarkIcon
                className="w-3 h-3 text-gold-deep/70"
                aria-hidden
              />
              {current_page}/{book.pages} · {percent}%
            </span>
          )}
          {hasProgress && startedLabel && <span>·</span>}
          {startedLabel && <span>começou em {startedLabel}</span>}
        </p>
      </div>
    </Link>
  );
}
