import Link from "next/link";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { BookCoverFallback, RatingStars } from "@/components/ui";
import type { TopBookOfYear } from "@/services/yearData";

type Props = {
  books: TopBookOfYear[];
};

export function TopBooksOfYear({ books }: Props) {
  if (books.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/book/${book.slug}`}
          className="group flex gap-3 p-3 rounded-lg border border-border bg-ivory-light hover:border-roasted-chestnut transition-colors duration-150"
        >
          <div
            className="relative flex-shrink-0 w-[50px] h-[75px] rounded-sm overflow-hidden border border-ink-deep/15"
            style={{ aspectRatio: "2 / 3" }}
          >
            <BookCoverFallback
              title={book.title}
              size="sm"
              className="w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5">
              <h3 className="font-display text-sm font-medium text-ink-deep leading-tight line-clamp-2 flex-1 min-w-0">
                {book.title}
              </h3>
              {book.is_favorite && (
                <HeartSolidIcon
                  className="w-3.5 h-3.5 text-burgundy flex-shrink-0 mt-0.5"
                  aria-label="Favorito"
                />
              )}
            </div>
            {book.author_name && (
              <p className="font-body text-xs italic text-ink-fade truncate mt-0.5">
                {book.author_name}
              </p>
            )}
            {book.rating !== null && book.rating > 0 && (
              <div className="mt-1.5">
                <RatingStars value={book.rating} size="text-xs" />
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
