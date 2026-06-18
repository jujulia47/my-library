import Link from "next/link";
import {
  BookmarkIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import type { TodayActivityItem } from "@/services/todayData";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

type Props = {
  activities: TodayActivityItem[];
};

/**
 * Lista de "tudo o que aconteceu hoje" — páginas registradas, anotações,
 * citações criadas, livros finalizados, aquisições. Cada item vira uma
 * linha pequena com ícone + texto + link contextual. Sem grandes destaques,
 * estilo bullet list de diário.
 */
export function TodayActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="bg-paper border border-paper-soft rounded-lg p-6 text-center">
        <p className="font-display italic text-ink-soft">
          Ainda nada por hoje — comece a página.
        </p>
      </div>
    );
  }

  // Ordem dos itens dentro do feed: páginas/notas primeiro (registro
  // contínuo da leitura), citações depois, finalizações em seguida e
  // aquisições por último. Dentro de cada grupo mantém a ordem de
  // chegada (já vem ordenada pelas queries).
  const order: Record<TodayActivityItem["kind"], number> = {
    pages: 0,
    quote: 1,
    finished: 2,
    acquired: 3,
  };
  const sorted = [...activities].sort(
    (a, b) => order[a.kind] - order[b.kind],
  );

  return (
    <ul className="bg-paper border border-paper-soft rounded-lg divide-y divide-paper-soft">
      {sorted.map((item, idx) => (
        <li key={`${item.kind}-${idx}`} className="px-4 py-3">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

function renderItem(item: TodayActivityItem) {
  if (item.kind === "pages") {
    return (
      <div className="flex gap-3 items-start">
        <BookmarkIcon
          className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-deep"
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-ink-soft">
            <span className="text-ink-deep font-medium">
              {item.pages_delta} {item.pages_delta === 1 ? "página" : "páginas"}
            </span>{" "}
            de{" "}
            <Link
              href={`/book/${item.book_slug}`}
              className="font-display italic text-ink-deep hover:text-gold-deep transition-colors"
            >
              {item.book_title}
            </Link>
          </p>
          {item.notes && (
            <p className="font-display italic text-base text-ink-deep mt-1 leading-relaxed">
              &ldquo;{item.notes}&rdquo;
            </p>
          )}
        </div>
      </div>
    );
  }
  if (item.kind === "quote") {
    return (
      <div className="flex gap-3 items-start">
        <ChatBubbleLeftIcon
          className="w-4 h-4 mt-0.5 flex-shrink-0 text-cappuccino"
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <Link
            href={`/quote/${item.quote_slug}`}
            className="block hover:opacity-90 transition-opacity"
          >
            <p className="font-display italic text-base text-ink-deep leading-relaxed line-clamp-3">
              &ldquo;{item.text}&rdquo;
            </p>
          </Link>
          <p className="text-xs italic text-ink-fade mt-1">
            {item.author_name && <>— {item.author_name}</>}
            {item.book_title && item.book_slug && (
              <>
                {item.author_name ? " em " : "em "}
                <Link
                  href={`/book/${item.book_slug}`}
                  className="not-italic underline hover:text-ink-deep transition-colors"
                >
                  {item.book_title}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }
  if (item.kind === "finished") {
    return (
      <div className="flex gap-3 items-start">
        <CheckCircleIcon
          className="w-4 h-4 mt-0.5 flex-shrink-0 text-moss"
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-ink-soft">
            Encerrou{" "}
            <Link
              href={`/book/${item.book_slug}`}
              className="font-display italic text-ink-deep hover:text-gold-deep transition-colors"
            >
              {item.book_title}
            </Link>
            {item.rating !== null && item.rating > 0 && (
              <span className="ml-2 inline-flex items-center gap-0.5 text-gold-deep">
                {Array.from({ length: Math.round(item.rating) }, (_, i) => (
                  <StarIcon key={i} className="w-3 h-3" />
                ))}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }
  // acquired
  return (
    <div className="flex gap-3 items-start">
      <ShoppingBagIcon
        className="w-4 h-4 mt-0.5 flex-shrink-0 text-terracota"
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-ink-soft">
          Adquiriu{" "}
          <Link
            href={`/book/${item.book_slug}`}
            className="font-display italic text-ink-deep hover:text-gold-deep transition-colors"
          >
            {item.book_title}
          </Link>
          {item.purchase_price !== null && item.purchase_price > 0 && (
            <span className="text-ink-fade ml-2">
              · {formatBRL(item.purchase_price)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
