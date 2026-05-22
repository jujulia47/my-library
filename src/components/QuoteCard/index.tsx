"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { toggleQuoteFavorite } from "@/actions/toggleQuoteFavorite";
import type { QuoteListItem, LegacyStatus } from "@/services/quoteList";

const statusBorderClass: Record<LegacyStatus, string> = {
  reading: "border-l-gold",
  paused: "border-l-olive",
  finished: "border-l-moss",
  abandoned: "border-l-burgundy",
  tbr: "border-l-ink-fade",
  wont_read: "border-l-cappuccino",
};

function buildAttribution(q: QuoteListItem): { main: string; muted?: boolean } {
  if (q.book) {
    const author = q.display_author ?? null;
    const titlePart = q.book.title;
    const pagePart = q.page ? `, p.${q.page}` : "";
    if (author) return { main: `— ${author}, ${titlePart}${pagePart}` };
    return { main: `— ${titlePart}${pagePart}` };
  }
  // book_id null: standalone OU órfã (livro deletado, ON DELETE SET NULL —
  // sessão 17.1). Sem coluna `was_book_linked` não dá pra distinguir as duas
  // origens; usamos heurística: se há autor/source, o user atribuiu — trata
  // como standalone normal. Se não tem nada, mostramos "(livro removido)".
  const author = q.display_author;
  const source = q.source?.trim() || null;
  if (author && source) return { main: `— ${author}, em ${source}` };
  if (author) return { main: `— ${author}` };
  if (source) return { main: `— ${source}` };
  return { main: "— (livro removido)", muted: true };
}

export default function QuoteCard({ quote }: { quote: QuoteListItem }) {
  const router = useRouter();
  const borderClass = quote.book
    ? statusBorderClass[quote.book.status]
    : "border-l-terracota";
  const attribution = buildAttribution(quote);

  // Estado otimista da estrela — mesmo pattern do BookCard/CollectionCard.
  const [favorite, setFavorite] = useState(quote.is_favorite);
  const [favPending, setFavPending] = useState(false);
  const [starHover, setStarHover] = useState(false);

  const handleFavoriteToggle = async () => {
    const previous = favorite;
    setFavorite(!previous);
    setFavPending(true);
    const result = await toggleQuoteFavorite(quote.id);
    setFavPending(false);
    if (!result.ok) {
      setFavorite(previous);
      return;
    }
    router.refresh();
  };

  // Sessão 17.3: citação favorita ganha border-l mais grossa + cor mais
  // saturada (gold-deep) + wash leve gold/5. Ressalta sem virar destaque
  // gritante.
  const isFavorite = quote.is_favorite;
  const containerClass = isFavorite
    ? "border-l-[4px] border-l-gold-deep bg-gold/5"
    : `border-l-[3px] ${borderClass} bg-ivory-light`;

  return (
    <div
      className={clsx(
        "group relative rounded-md border border-border",
        "transition-colors duration-150 hover:border-gold",
        containerClass,
      )}
    >
      <Link
        href={`/quote/${quote.slug}`}
        className="block px-5 py-4 pr-12"
      >
        <div className="flex gap-3">
          <span
            aria-hidden
            className="font-display text-[32px] leading-none text-gold-deep select-none"
          >
            “
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display italic text-ink-deep text-lg leading-relaxed line-clamp-4">
              {quote.text}
            </p>
            <p
              className={clsx(
                "italic text-sm mt-2",
                attribution.muted ? "text-ink-fade" : "text-ink-fade",
              )}
            >
              {attribution.main}
            </p>
            {quote.note && (
              <div className="mt-3 border-l-2 border-border pl-3 text-sm italic text-ink-soft">
                {quote.note}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Estrela de favorito — padrão `.card-icon-btn`: bg fixo, ícone escala
          (1.1) no hover, swap outline→solid pra preview. */}
      <button
        type="button"
        aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        title={favorite ? "Favorita" : "Marcar como favorita"}
        aria-pressed={favorite}
        disabled={favPending}
        onMouseEnter={() => setStarHover(true)}
        onMouseLeave={() => setStarHover(false)}
        onFocus={() => setStarHover(true)}
        onBlur={() => setStarHover(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFavoriteToggle();
        }}
        className={clsx(
          "card-icon-btn cursor-pointer absolute top-3 right-3 z-10 p-1.5 rounded-md",
          "bg-ivory-light/95 backdrop-blur-sm border border-border",
          favorite || starHover ? "text-gold" : "text-ink-fade/60",
          !favorite &&
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          favPending && "opacity-60 cursor-wait",
        )}
      >
        {favorite || starHover ? (
          <StarSolidIcon className="w-4 h-4" />
        ) : (
          <StarOutlineIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
