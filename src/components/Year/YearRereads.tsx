import Link from "next/link";
import Image from "next/image";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { BookCoverFallback, RatingStars, Badge } from "@/components/ui";
import type { YearReread } from "@/services/yearData";

type Props = {
  year: number;
  data: { count: number; books: YearReread[] };
};

/**
 * Releituras do ano — visão à parte dos "livros lidos" (não mexe na contagem).
 * Mostra quantas releituras rolaram e quais livros foram relidos.
 */
export function YearRereads({ year, data }: Props) {
  if (data.books.length === 0) return null;

  return (
    <div>
      <p className="font-body italic text-ink-fade text-sm mb-4">
        {data.count === 1
          ? "1 releitura neste ano — um reencontro com uma história que você já conhecia."
          : `${data.count} releituras neste ano — reencontros com histórias que você já conhecia.`}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.books.map((book) => (
          <Link
            key={book.slug}
            href={`/book/${book.slug}`}
            className="group flex gap-3 p-3 rounded-lg border border-border bg-ivory-light hover:border-roasted-chestnut transition-colors duration-150"
          >
            <div
              className="relative flex-shrink-0 w-[50px] h-[75px] rounded-sm overflow-hidden border border-ink-deep/15"
              style={{ aspectRatio: "2 / 3" }}
            >
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="50px"
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
              <h3 className="font-display text-sm font-medium text-ink-deep leading-tight line-clamp-2">
                {book.title}
              </h3>
              {book.author_name && (
                <p className="font-body text-xs italic text-ink-fade truncate mt-0.5">
                  {book.author_name}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <Badge variant="navy" size="sm">
                  <span className="flex items-center gap-1">
                    <ArrowPathIcon className="w-3 h-3" aria-hidden />
                    {book.times_total}ª leitura
                  </span>
                </Badge>
                {book.year_reread_count > 1 && (
                  <span className="text-[11px] italic text-ink-fade">
                    relido {book.year_reread_count}× em {year}
                  </span>
                )}
              </div>
              {book.rating !== null && book.rating > 0 && (
                <div className="mt-1.5">
                  <RatingStars value={book.rating} size="text-xs" />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
