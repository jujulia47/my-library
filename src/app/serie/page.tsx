import AppShell from "@/components/AppShell";
import {
  serieListQuery,
  serieCounts,
  type SerieListSort,
} from "@/services/serieList";
import { createClient } from "@/utils/supabase/server";
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
  "reading_first",
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
  const serieSlugs = parseList(sp.serie);
  const sortRaw = pickFirst(sp.sort) ?? "reading_first";
  const sort = (
    VALID_SORTS.has(sortRaw as SerieListSort) ? sortRaw : "reading_first"
  ) as SerieListSort;

  // Lista de todas as séries do usuário pra alimentar o filtro "Por série".
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: rawAllSeries } = user
    ? await supabase
        .from("serie")
        .select("id, slug, name")
        .eq("user_id", user.id)
        .order("name", { ascending: true })
    : { data: [] };
  const allSeries = (rawAllSeries ?? []) as {
    id: string;
    slug: string;
    name: string;
  }[];

  const [series, counts] = await Promise.all([
    serieListQuery({ statuses, progress, serie_slugs: serieSlugs, sort }),
    serieCounts(),
  ]);

  const hasActiveFilters =
    statuses.length + progress.length + serieSlugs.length > 0;
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
            <SerieFilters allSeries={allSeries} />
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
