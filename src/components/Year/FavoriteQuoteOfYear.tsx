import Link from "next/link";
import { QuillAndInk } from "@/components/decorations/QuillAndInk";
import type { FavoriteQuote } from "@/services/yearData";

type Props = {
  quote: FavoriteQuote;
};

export function FavoriteQuoteOfYear({ quote }: Props) {
  return (
    <div
      className="relative rounded-lg p-6 border border-gold/30 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--color-paper-soft) 0%, rgba(240, 192, 64, 0.12) 100%)",
      }}
    >
      <QuillAndInk
        size="sm"
        className="absolute -top-1 right-3"
        style={{ opacity: 0.55 }}
      />

      <blockquote className="font-display italic text-base md:text-lg leading-relaxed text-ink-deep pr-12">
        “{quote.text}”
      </blockquote>
      <p className="text-xs italic text-ink-fade mt-3">
        — {quote.author_name ?? "Autor desconhecido"}
        {quote.book_title && quote.book_slug && (
          <>
            {" em "}
            <Link
              href={`/book/${quote.book_slug}`}
              className="not-italic underline hover:text-ink-deep transition-colors"
            >
              {quote.book_title}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
