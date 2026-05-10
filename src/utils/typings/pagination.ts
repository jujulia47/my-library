export type Pagination = {
  page: number;
  per_page: number;
};

export type Paginated<T> = {
  rows: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 50;

type SearchParamLike = Record<string, string | string[] | undefined>;

function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Lê `page` e `per_page` da URL/searchParams. Aplica defaults e clampagem:
 * - page mínimo 1
 * - per_page entre 1 e MAX_PER_PAGE; default = DEFAULT_PER_PAGE
 *
 * Aceita tanto URLSearchParams quanto o `Record<string, string|string[]>`
 * que vem do Next 15 (Promise<searchParams>) — assinatura conveniente pros
 * dois uses comuns.
 */
export function parsePagination(
  source: URLSearchParams | SearchParamLike,
): Pagination {
  let pageRaw: string | undefined;
  let perPageRaw: string | undefined;
  if (source instanceof URLSearchParams) {
    pageRaw = source.get("page") ?? undefined;
    perPageRaw = source.get("per_page") ?? undefined;
  } else {
    pageRaw = pickFirst(source.page);
    perPageRaw = pickFirst(source.per_page);
  }
  const page = Math.max(1, Number(pageRaw ?? 1) || 1);
  const perPageNum = Number(perPageRaw ?? DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE;
  const per_page = Math.min(MAX_PER_PAGE, Math.max(1, perPageNum));
  return { page, per_page };
}

/**
 * Slice em memória pra paginar arrays já filtrados/sortados em memória.
 * Para volume típico de biblioteca pessoal (poucos milhares de rows), o custo
 * de buscar tudo + paginar em memória é aceitável e simplifica a contagem
 * (count = filtered.length, sempre exato — diferente do count Postgres que
 * só conta filtros nativos).
 */
export function paginateArray<T>(
  rows: T[],
  pagination: Pagination,
): Paginated<T> {
  const total = rows.length;
  const total_pages = Math.max(1, Math.ceil(total / pagination.per_page));
  // Se page > total_pages, clampa pra última (evita "Mostrando 41-60 de 30").
  const page = Math.min(Math.max(1, pagination.page), total_pages);
  const start = (page - 1) * pagination.per_page;
  const end = start + pagination.per_page;
  return {
    rows: rows.slice(start, end),
    total,
    page,
    per_page: pagination.per_page,
    total_pages,
  };
}
