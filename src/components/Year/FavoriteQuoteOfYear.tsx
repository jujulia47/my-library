import Link from "next/link";
import { QuillAndInk } from "@/components/decorations/QuillAndInk";
import type { FavoriteQuote } from "@/services/yearData";

type Props = {
  quote: FavoriteQuote;
};

export function FavoriteQuoteOfYear({ quote }: Props) {
  return (
    <div
      className="relative rounded-lg px-6 py-5 md:px-8 md:py-6 border border-gold/30 overflow-hidden"
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

      {/* Aspas decorativas no canto superior esquerdo — recuam visualmente
          o texto e dão o ar de "página de diário". */}
      <span
        aria-hidden
        className="absolute top-1 left-3 md:top-0 md:left-4 font-display text-5xl md:text-6xl leading-none text-gold-deep/35 select-none"
      >
        “
      </span>

      <blockquote className="relative font-display italic text-base md:text-lg leading-relaxed text-ink-deep pl-6 md:pl-9 pr-8 md:pr-12">
        {quote.text}
      </blockquote>
      <p className="text-xs italic text-ink-fade mt-3 pl-6 md:pl-9">
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
