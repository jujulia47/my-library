import AppShell from "@/components/AppShell";
import QuoteCard from "@/components/QuoteCard";
import QuoteFilters from "@/components/Read/Quotes/QuoteFilters";
import { NoQuotes, NoFilteredQuotes } from "@/components/Read/Quotes/QuoteEmpty";
import {
  quoteListQuery,
  quoteCounts,
  booksWithQuotes,
  authorsInQuotes,
  type QuoteListSort,
  type QuoteListType,
} from "@/services/quoteList";
import { PageHeader, Button, Pagination } from "@/components/ui";
import {
  parsePagination,
  paginateArray,
} from "@/utils/typings/pagination";

const VALID_SORTS = new Set<QuoteListSort>(["newest", "oldest", "author_asc"]);
const VALID_TYPES = new Set<QuoteListType>(["linked", "standalone"]);

function parseList(v: string | string[] | undefined): string[] {
  const raw = Array.isArray(v) ? v[0] : v;
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const types = parseList(sp.type).filter((t): t is QuoteListType =>
    VALID_TYPES.has(t as QuoteListType),
  );
  const bookIds = parseList(sp.book);
  const authorNames = parseList(sp.author);
  const search = pickFirst(sp.q) ?? "";
  const sortRaw = pickFirst(sp.sort) ?? "newest";
  const sort = (
    VALID_SORTS.has(sortRaw as QuoteListSort) ? sortRaw : "newest"
  ) as QuoteListSort;

  const [items, counts, books, authors] = await Promise.all([
    quoteListQuery({ types, bookIds, authorNames, search, sort }),
    quoteCounts(),
    booksWithQuotes(),
    authorsInQuotes(),
  ]);

  const pagination = parsePagination(sp);
  const paged = paginateArray(items, pagination);

  const subtitleBase =
    counts.total === 0
      ? "Nada guardado ainda"
      : `${counts.total} ${counts.total === 1 ? "citação" : "citações"} · ${counts.linked} de livros · ${counts.standalone} avulsas`;

  return (
    <AppShell>
      <PageHeader
        title="Citações"
        subtitle={subtitleBase}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <QuoteFilters
              booksWithQuotes={books}
              authorsAvailable={authors}
            />
            <Button as="Link" href="/quote/new" variant="primary" size="sm">
              + Adicionar citação
            </Button>
          </div>
        }
      />

      {paged.total === 0 ? (
        counts.total === 0 ? (
          <NoQuotes />
        ) : (
          <NoFilteredQuotes />
        )
      ) : (
        <>
          <div className="space-y-3">
            {paged.rows.map((q) => (
              <QuoteCard key={q.id} quote={q} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            total_pages={paged.total_pages}
            total={paged.total}
            per_page={paged.per_page}
            basePath="/quote"
            searchParams={sp}
            itemLabelSingular="citação"
            itemLabelPlural="citações"
          />
        </>
      )}
    </AppShell>
  );
}
