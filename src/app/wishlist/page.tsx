import AppShell from "@/components/AppShell";
import WishlistCard from "@/components/WishlistCard";
import WishlistFilters from "@/components/Read/Wishlist/WishlistFilters";
import {
  NoWishlist,
  NoFilteredWishlist,
} from "@/components/Read/Wishlist/WishlistEmpty";
import {
  wishlistListQuery,
  wishlistTotals,
  type WishlistListSort,
  type WishlistPriorityFilter,
  type WishlistPriceRange,
} from "@/services/wishlistList";
import { PageHeader, Button, Pagination } from "@/components/ui";
import {
  parsePagination,
  paginateArray,
} from "@/utils/typings/pagination";
import { formatBRL } from "@/utils/formatCurrency";

const VALID_SORTS = new Set<WishlistListSort>([
  "newest",
  "priority",
  "price_asc",
  "price_desc",
  "title_asc",
]);
const VALID_PRIORITIES = new Set<WishlistPriorityFilter>([
  "low",
  "medium",
  "high",
  "none",
]);
const VALID_PRICES = new Set<WishlistPriceRange>([
  "under_30",
  "30_60",
  "60_100",
  "over_100",
  "none",
]);

function parseList(v: string | string[] | undefined): string[] {
  const raw = Array.isArray(v) ? v[0] : v;
  if (!raw) return [];
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}

function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const priorities = parseList(sp.priority).filter(
    (p): p is WishlistPriorityFilter =>
      VALID_PRIORITIES.has(p as WishlistPriorityFilter),
  );
  const priceRanges = parseList(sp.price).filter(
    (p): p is WishlistPriceRange =>
      VALID_PRICES.has(p as WishlistPriceRange),
  );
  const search = pickFirst(sp.q) ?? "";
  const sortRaw = pickFirst(sp.sort) ?? "newest";
  const sort = (
    VALID_SORTS.has(sortRaw as WishlistListSort) ? sortRaw : "newest"
  ) as WishlistListSort;

  const [items, totals] = await Promise.all([
    wishlistListQuery({ priorities, priceRanges, search, sort }),
    wishlistTotals(),
  ]);

  const pagination = parsePagination(sp);
  const paged = paginateArray(items, pagination);

  const subtitle =
    totals.count === 0
      ? "Sua lista de desejos começa aqui"
      : `${totals.count} ${totals.count === 1 ? "livro" : "livros"} · valor estimado: ${formatBRL(totals.estimatedTotal)}`;

  return (
    <AppShell>
      <PageHeader
        title="Wishlist"
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <WishlistFilters />
            <Button as="Link" href="/wishlist/new" variant="primary" size="sm">
              + Adicionar à wishlist
            </Button>
          </div>
        }
      />

      {paged.total === 0 ? (
        totals.count === 0 ? (
          <NoWishlist />
        ) : (
          <NoFilteredWishlist />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paged.rows.map((w) => (
              <WishlistCard key={w.id} item={w} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            total_pages={paged.total_pages}
            total={paged.total}
            per_page={paged.per_page}
            basePath="/wishlist"
            searchParams={sp}
            itemLabelSingular="livro"
            itemLabelPlural="livros"
          />
        </>
      )}
    </AppShell>
  );
}
