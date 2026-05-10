import AppShell from "@/components/AppShell";
import {
  serieListQuery,
  serieCounts,
  type SerieListSort,
} from "@/services/serieList";
import { PageHeader, Button, Pagination } from "@/components/ui";
import SerieFilters from "@/components/Read/Serie/SerieFilters";
import SerieRow from "@/components/Read/Serie/SerieRow";
import {
  NoSeries,
  NoFilteredSeries,
} from "@/components/Read/Serie/SerieEmpty";
import {
  parsePagination,
  paginateArray,
} from "@/utils/typings/pagination";

const VALID_SORTS = new Set<SerieListSort>([
  "name_asc",
  "name_desc",
  "last_activity_desc",
  "started_asc",
  "qty_volumes_asc",
  "qty_volumes_desc",
]);

function parseList(v: string | string[] | undefined): string[] {
  const raw = Array.isArray(v) ? v[0] : v;
  if (!raw) return [];
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}

function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SeriePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const statuses = parseList(sp.status);
  const progress = parseList(sp.progress);
  const sortRaw = pickFirst(sp.sort) ?? "name_asc";
  const sort = (
    VALID_SORTS.has(sortRaw as SerieListSort) ? sortRaw : "name_asc"
  ) as SerieListSort;

  const [series, counts] = await Promise.all([
    serieListQuery({ statuses, progress, sort }),
    serieCounts(),
  ]);

  const hasActiveFilters = statuses.length + progress.length > 0;
  const pagination = parsePagination(sp);
  const paged = paginateArray(series, pagination);

  return (
    <AppShell>
      <PageHeader
        title="Séries"
        subtitle={
          counts.total === 0
            ? "Acompanhe leituras volume por volume"
            : `${counts.total} ${counts.total === 1 ? "série" : "séries"}`
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SerieFilters />
            <Button as="Link" href="/serie/new" variant="primary" size="sm">
              + Adicionar série
            </Button>
          </div>
        }
      />

      {paged.total === 0 ? (
        counts.total === 0 ? (
          <NoSeries />
        ) : hasActiveFilters ? (
          <NoFilteredSeries />
        ) : (
          <NoSeries />
        )
      ) : (
        <>
          <div className="space-y-6">
            {paged.rows.map((s) => (
              <SerieRow key={s.id} serie={s} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            total_pages={paged.total_pages}
            total={paged.total}
            per_page={paged.per_page}
            basePath="/serie"
            searchParams={sp}
            itemLabelSingular="série"
            itemLabelPlural="séries"
          />
        </>
      )}
    </AppShell>
  );
}
