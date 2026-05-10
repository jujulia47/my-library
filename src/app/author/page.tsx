import AppShell from "@/components/AppShell";
import AuthorCard from "@/components/AuthorCard";
import AuthorFilters from "@/components/Read/Author/AuthorFilters";
import {
  NoAuthors,
  NoFilteredAuthors,
} from "@/components/Read/Author/AuthorEmpty";
import { PageHeader, Button, Pagination } from "@/components/ui";
import {
  authorListQuery,
  authorCounts,
  authorCountriesAvailable,
  pickAuthorSort,
} from "@/services/authorList";
import {
  parsePagination,
  paginateArray,
} from "@/utils/typings/pagination";
import type { Database } from "@/utils/typings/supabase";

type Country = Database["public"]["Enums"]["country"];

const VALID_COUNTRIES = new Set<Country>([
  "africa_do_sul", "alemanha", "angola", "argentina", "australia",
  "brasil", "cabo_verde", "canada", "chile", "china",
  "colombia", "coreia_do_sul", "cuba", "egito", "espanha",
  "estados_unidos", "franca", "holanda", "hungria", "india",
  "irlanda", "israel", "italia", "japao", "mexico",
  "mocambique", "noruega", "peru", "polonia", "portugal",
  "reino_unido", "republica_tcheca", "russia", "suecia", "turquia",
]);

function parseList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const raw = Array.isArray(v) ? v[0] : v;
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}
function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AuthorListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = pickFirst(sp.q) ?? "";
  const countries = parseList(sp.country).filter((c): c is Country =>
    VALID_COUNTRIES.has(c as Country),
  );
  const hasBooks = pickFirst(sp.has_books) === "true";
  const sort = pickAuthorSort(pickFirst(sp.sort));

  const [authors, counts, countriesAvailable] = await Promise.all([
    authorListQuery({ search, countries, hasBooks, sort }),
    authorCounts(),
    authorCountriesAvailable(),
  ]);

  const pagination = parsePagination(sp);
  // 18 padrão pro grid 3-col (6 linhas) — sobrescreve o default global de 20
  const paged = paginateArray(authors, {
    page: pagination.page,
    per_page: pagination.per_page === 20 ? 18 : pagination.per_page,
  });

  const subtitle =
    counts.total === 0
      ? "Você não tem autores cadastrados ainda"
      : `${counts.total} ${counts.total === 1 ? "autor" : "autores"} · ${counts.with_books} com livros no acervo`;

  return (
    <AppShell>
      <PageHeader
        title="Autores"
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AuthorFilters countriesAvailable={countriesAvailable} />
            <Button as="Link" href="/author/new" variant="primary" size="sm">
              + Novo autor
            </Button>
          </div>
        }
      />

      {paged.total === 0 ? (
        counts.total === 0 ? (
          <NoAuthors />
        ) : (
          <NoFilteredAuthors />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.rows.map((a) => (
              <AuthorCard key={a.id} author={a} />
            ))}
          </div>
          <Pagination
            page={paged.page}
            total_pages={paged.total_pages}
            total={paged.total}
            per_page={paged.per_page}
            basePath="/author"
            searchParams={sp}
            itemLabelSingular="autor"
            itemLabelPlural="autores"
          />
        </>
      )}
    </AppShell>
  );
}
