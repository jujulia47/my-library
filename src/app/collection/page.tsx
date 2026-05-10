import AppShell from "@/components/AppShell";
import CollectionCard from "@/components/CollectionCard";
import CollectionFilters from "@/components/Read/Collection/CollectionFilters";
import {
  NoCollections,
  NoFilteredCollections,
} from "@/components/Read/Collection/CollectionEmpty";
import { Button, PageHeader, Pagination } from "@/components/ui";
import {
  collectionListQuery,
  collectionCounts,
  subscriptionProviders,
  type CollectionListSort,
} from "@/services/collectionList";
import {
  parsePagination,
  paginateArray,
} from "@/utils/typings/pagination";

const VALID_SORTS = new Set<CollectionListSort>([
  "newest",
  "type_asc",
  "progress_asc",
  "progress_desc",
  "name_asc",
]);

function parseList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const raw = Array.isArray(v) ? v.join(",") : v;
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const types = parseList(sp.type);
  const statuses = parseList(sp.status);
  const providers = parseList(sp.provider);
  const sortRaw = pickFirst(sp.sort);
  const sort: CollectionListSort = VALID_SORTS.has(
    sortRaw as CollectionListSort,
  )
    ? (sortRaw as CollectionListSort)
    : "newest";

  const [items, counts, providersAvailable] = await Promise.all([
    collectionListQuery({ types, statuses, providers, sort }),
    collectionCounts(),
    subscriptionProviders(),
  ]);

  const hasAnyFilter =
    types.length > 0 || statuses.length > 0 || providers.length > 0;

  const pagination = parsePagination(sp);
  const paged = paginateArray(items, pagination);

  const subtitle =
    counts.total === 0
      ? "Nenhuma coleção ainda"
      : `${counts.total} ${counts.total === 1 ? "coleção" : "coleções"} · ${counts.unique_items} ${counts.unique_items === 1 ? "item agrupado" : "itens agrupados"} (sem duplicar)`;

  return (
    <AppShell>
      <PageHeader
        title="Coleções"
        subtitle={subtitle}
        actions={
          <>
            <CollectionFilters providersAvailable={providersAvailable} />
            <Button
              as="Link"
              href="/collection/new"
              variant="primary"
              size="sm"
            >
              + Nova coleção
            </Button>
          </>
        }
      />

      {paged.total === 0 ? (
        counts.total === 0 && !hasAnyFilter ? (
          <NoCollections />
        ) : (
          <NoFilteredCollections />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paged.rows.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            total_pages={paged.total_pages}
            total={paged.total}
            per_page={paged.per_page}
            basePath="/collection"
            searchParams={sp}
            itemLabelSingular="coleção"
            itemLabelPlural="coleções"
          />
        </>
      )}
    </AppShell>
  );
}
