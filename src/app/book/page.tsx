import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import BookCard from "@/components/BookCard";
import BookFilters from "@/components/Read/Book/BookFilters";
import { NoBooks, NoFilteredBooks } from "@/components/Read/Book/BookEmpty";
import {
  bookListQuery,
  bookCounts,
  countPhysicalCopies,
  yearsWithFinishedReadings,
  type BookListSort,
} from "@/services/bookList";
import { createClient } from "@/utils/supabase/server";
import { PageHeader, Button, Pagination } from "@/components/ui";
import {
  parsePagination,
  paginateArray,
} from "@/utils/typings/pagination";

const VALID_SORTS = new Set<BookListSort>([
  "reading_first",
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
  const authorSlugs = parseList(sp.author);
  const yearStr = pickFirst(sp.year);
  const monthStr = pickFirst(sp.month);
  const year = yearStr ? Number(yearStr) || undefined : undefined;
  const month = monthStr ? Number(monthStr) || undefined : undefined;
  const favorite = pickFirst(sp.favorite) === "1";
  const sortRaw = pickFirst(sp.sort) ?? "reading_first";
  const sort = (
    VALID_SORTS.has(sortRaw as BookListSort) ? sortRaw : "reading_first"
  ) as BookListSort;

  // Lista de todos os autores do usuário pra alimentar o filtro "Por autor".
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: rawAllAuthors } = user
    ? await supabase
        .from("author")
        .select("id, slug, name")
        .eq("user_id", user.id)
        .order("name", { ascending: true })
    : { data: [] };
  const allAuthors = (rawAllAuthors ?? []) as {
    id: string;
    slug: string;
    name: string;
  }[];

  const [books, counts, years] = await Promise.all([
    bookListQuery({
      statuses,
      ownerships,
      formats,
      author_slugs: authorSlugs,
      year,
      month,
      favorite,
      sort,
    }),
    bookCounts(),
    yearsWithFinishedReadings(),
  ]);

  const pagination = parsePagination(sp);
  const paged = paginateArray(books, pagination);

  // Subtítulo do header. Base (sempre): total de títulos cadastrados — conta
  // volumes que dividem exemplar separadamente, é o "acervo cadastrado". Com
  // filtro ativo, mostra também quantos livros caem no filtro. Para "Na
  // estante" (owned) essa contagem ignora duplicados de exemplar físico:
  // volumes bundled contam 1 (os cards na lista continuam todos visíveis).
  const anyFilter =
    statuses.length > 0 ||
    ownerships.length > 0 ||
    formats.length > 0 ||
    authorSlugs.length > 0 ||
    year !== undefined ||
    month !== undefined ||
    favorite;
  // "Na estante" agora é o grupo lógico `na_estante` (antes era o valor cru
  // `owned`). Mantém a contagem que deduplica exemplares físicos (volumes
  // bundled contam 1).
  const isNaEstante = ownerships.includes("na_estante");
  const filteredVolumes = books.length;
  const filteredPhysical = isNaEstante
    ? countPhysicalCopies(books)
    : filteredVolumes;
  // Volumes "a mais" por dividirem exemplar — diferença entre cadastrados e
  // exemplares físicos no recorte atual.
  const sharedVolumes = filteredVolumes - filteredPhysical;

  let subtitle: ReactNode;
  if (counts.total === 0) {
    subtitle = "Sua estante começa aqui";
  } else {
    const base = `${counts.total} ${
      counts.total === 1 ? "título" : "títulos"
    } · ${counts.finished} lidos`;
    if (!anyFilter) {
      subtitle = base;
    } else if (isNaEstante) {
      subtitle = (
        <>
          {base} · {filteredPhysical}{" "}
          {filteredPhysical === 1 ? "livro" : "livros"} na estante
          {sharedVolumes > 0 && (
            <>
              <br />
              <span className="text-sm not-italic text-ink-fade">
                {filteredVolumes} volumes na estante — {sharedVolumes}{" "}
                {sharedVolumes === 1
                  ? "compõe o mesmo livro físico que outro"
                  : "compõem o mesmo livro físico que outro"}
                .
              </span>
            </>
          )}
        </>
      );
    } else {
      subtitle = `${base} · ${filteredVolumes} ${
        filteredVolumes === 1 ? "livro" : "livros"
      } no filtro`;
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Livros"
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <BookFilters yearsAvailable={years} allAuthors={allAuthors} />
            <Button as="Link" href="/book/new" variant="primary" size="sm">
              + Catalogar livro
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
            {paged.rows.map((b, i) => (
              // Primeiras 5 imagens viram `priority` (LCP). Próximas ficam
              // com lazy-load padrão do Next/Image.
              <BookCard key={b.id} book={b} priority={i < 5} />
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
