import AppShell from "@/components/AppShell";
import BookCard from "@/components/BookCard";
import BookFilters from "@/components/Read/Book/BookFilters";
import { NoBooks, NoFilteredBooks } from "@/components/Read/Book/BookEmpty";
import {
  bookListQuery,
  bookCounts,
  yearsWithFinishedReadings,
  type BookListSort,
} from "@/services/bookList";
import { PageHeader, Button, Pagination } from "@/components/ui";
import {
  parsePagination,
  paginateArray,
} from "@/utils/typings/pagination";

const VALID_SORTS = new Set<BookListSort>([
  "title_asc",
  "title_desc",
  "created_desc",
  "last_reading_desc",
  "acquired_asc",
]);

function parseList(v: string | string[] | undefined): string[] {
  const raw = Array.isArray(v) ? v[0] : v;
  if (!raw) return [];
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}

function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const statuses = parseList(sp.status);
  const ownerships = parseList(sp.ownership);
  const formats = parseList(sp.format);
  const yearStr = pickFirst(sp.year);
  const monthStr = pickFirst(sp.month);
  const year = yearStr ? Number(yearStr) || undefined : undefined;
  const month = monthStr ? Number(monthStr) || undefined : undefined;
  const sortRaw = pickFirst(sp.sort) ?? "last_reading_desc";
  const sort = (
    VALID_SORTS.has(sortRaw as BookListSort) ? sortRaw : "last_reading_desc"
  ) as BookListSort;

  const [books, counts, years] = await Promise.all([
    bookListQuery({ statuses, ownerships, formats, year, month, sort }),
    bookCounts(),
    yearsWithFinishedReadings(),
  ]);

  const pagination = parsePagination(sp);
  const paged = paginateArray(books, pagination);

  return (
    <AppShell>
      <PageHeader
        title="Livros"
        subtitle={
          counts.total === 0
            ? "Sua estante começa aqui"
            : `${counts.total} ${counts.total === 1 ? "título" : "títulos"} · ${counts.finished} lidos`
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <BookFilters yearsAvailable={years} />
            <Button as="Link" href="/book/new" variant="primary" size="sm">
              + Adicionar livro
            </Button>
          </div>
        }
      />

      {paged.total === 0 ? (
        counts.total === 0 ? (
          <NoBooks />
        ) : (
          <NoFilteredBooks />
        )
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {paged.rows.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            total_pages={paged.total_pages}
            total={paged.total}
            per_page={paged.per_page}
            basePath="/book"
            searchParams={sp}
            itemLabelSingular="livro"
            itemLabelPlural="livros"
          />
        </>
      )}
    </AppShell>
  );
}
