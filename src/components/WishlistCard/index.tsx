import Link from "next/link";
import clsx from "clsx";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Badge, BookCoverFallback } from "@/components/ui";
import type { Database } from "@/utils/typings/supabase";

type WishlistRow = Database["public"]["Tables"]["wishlist"]["Row"];
type WishlistPriority = Database["public"]["Enums"]["wishlist_priority"];

// Sessão 17.3: border-l da wishlist agora é terracota fixo (semântico:
// wishlist = aquisição/desejo). Prioridade fica só no badge — antes era
// duplicado (border + badge).
const priorityBadgeVariant: Record<
  WishlistPriority,
  "burgundy" | "gold" | "fade"
> = {
  high: "burgundy",
  medium: "gold",
  low: "fade",
};

const priorityLabel: Record<WishlistPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

function formatPrice(value: number | null): string | null {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function shortDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function WishlistCard({ item }: { item: WishlistRow }) {
  const price = formatPrice(item.estimated_price ?? null);
  const domain = shortDomain(item.purchase_link ?? null);

  return (
    <Link
      href={`/wishlist/${item.slug}`}
      className={clsx(
        "group relative flex gap-4 rounded-md border border-border border-l-[3px] border-l-terracota bg-ivory-light",
        "p-3 transition-colors duration-150 hover:border-gold",
      )}
    >
      <div className="flex-shrink-0">
        <BookCoverFallback title={item.title} size="sm" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3 className="font-display text-base font-medium text-ink-deep leading-snug line-clamp-2">
          {item.title}
        </h3>
        {item.author_name && (
          <p className="text-sm italic text-ink-fade line-clamp-1">
            {item.author_name}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {price && (
            <span className="text-sm text-ink-soft">{price}</span>
          )}
          {item.priority && (
            <Badge
              variant={priorityBadgeVariant[item.priority]}
              size="sm"
            >
              {priorityLabel[item.priority]}
            </Badge>
          )}
          {domain && item.purchase_link && (
            <span
              className="inline-flex items-center gap-1 text-xs text-ink-fade italic max-w-[160px]"
              title={item.purchase_link}
            >
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              <span className="truncate">{domain}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
