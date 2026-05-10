import Link from "next/link";
import clsx from "clsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export type PaginationProps = {
  page: number;
  total_pages: number;
  total: number;
  per_page: number;
  basePath: string;
  /**
   * Search params atuais (parseados pelo Server Component que chama). Passamos
   * Record cru — preservados na query string de cada link gerado pra que
   * filtros/sort não se percam ao trocar de página.
   */
  searchParams: Record<string, string | string[] | undefined>;
  /** Rótulo da unidade no texto "Mostrando X–Y de Z {item|itens}". Default: "items". */
  itemLabelSingular?: string;
  itemLabelPlural?: string;
};

/**
 * Cria a query string completa preservando filtros existentes; força page
 * pro valor passado (e omite quando page === 1 pra URLs limpas na primeira).
 */
function buildHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  nextPage: number,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === "page") continue; // sempre sobrescreve abaixo
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      const first = v[0];
      if (first) params.set(k, first);
    } else {
      params.set(k, v);
    }
  }
  if (nextPage > 1) params.set("page", String(nextPage));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Calcula o array de páginas a renderizar.
 *  - <= 7 páginas: todas
 *  - > 7: 1, ..., (page-1, page, page+1), ..., last (com edge cases nas pontas)
 */
function buildPageList(page: number, total_pages: number): (number | "...")[] {
  if (total_pages <= 7) {
    return Array.from({ length: total_pages }, (_, i) => i + 1);
  }
  const result: (number | "...")[] = [];
  result.push(1);
  const window = new Set<number>();
  // Janela de 3 ao redor da current; ajustada nas pontas pra mostrar mais
  // contexto sem repetir 1 ou último.
  const lo = Math.max(2, page - 1);
  const hi = Math.min(total_pages - 1, page + 1);
  let start = lo;
  let end = hi;
  if (page <= 3) {
    start = 2;
    end = 4;
  } else if (page >= total_pages - 2) {
    start = total_pages - 3;
    end = total_pages - 1;
  }
  for (let i = start; i <= end; i++) window.add(i);

  if (start > 2) result.push("...");
  for (const n of [...window].sort((a, b) => a - b)) result.push(n);
  if (end < total_pages - 1) result.push("...");
  result.push(total_pages);
  return result;
}

export default function Pagination({
  page,
  total_pages,
  total,
  per_page,
  basePath,
  searchParams,
  itemLabelSingular = "item",
  itemLabelPlural = "items",
}: PaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * per_page + 1;
  const end = Math.min(page * per_page, total);
  const itemLabel = total === 1 ? itemLabelSingular : itemLabelPlural;
  const rangeText = `Mostrando ${start}–${end} de ${total} ${itemLabel}`;

  // Single page: só o texto, sem controles.
  if (total_pages <= 1) {
    return (
      <nav
        aria-label="Paginação"
        className="mt-8 flex items-center justify-center pt-4 border-t border-border"
      >
        <p className="text-sm italic text-ink-fade">{rangeText}</p>
      </nav>
    );
  }

  const pages = buildPageList(page, total_pages);
  const prevHref = buildHref(basePath, searchParams, Math.max(1, page - 1));
  const nextHref = buildHref(
    basePath,
    searchParams,
    Math.min(total_pages, page + 1),
  );
  const isFirst = page <= 1;
  const isLast = page >= total_pages;

  return (
    <nav
      aria-label="Paginação"
      className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border"
    >
      <p className="text-sm italic text-ink-fade">{rangeText}</p>
      <ul className="flex items-center gap-1 flex-wrap">
        <li>
          {isFirst ? (
            <span
              aria-disabled
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-ink-fade opacity-50 cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Anterior
            </span>
          ) : (
            <Link
              href={prevHref}
              rel="prev"
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Anterior
            </Link>
          )}
        </li>
        {pages.map((p, idx) =>
          p === "..." ? (
            <li
              key={`ellipsis-${idx}`}
              aria-hidden
              className="px-2 text-ink-fade text-sm"
            >
              …
            </li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span
                  aria-current="page"
                  className="inline-flex items-center justify-center min-w-[36px] h-9 rounded-md border border-gold bg-gold/15 text-ink-deep font-medium text-sm px-2"
                >
                  {p}
                </span>
              ) : (
                <Link
                  href={buildHref(basePath, searchParams, p)}
                  className={clsx(
                    "inline-flex items-center justify-center min-w-[36px] h-9 rounded-md border border-border bg-ivory-light text-ink-soft text-sm px-2",
                    "hover:text-ink-deep hover:bg-paper-soft transition-colors",
                  )}
                >
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {isLast ? (
            <span
              aria-disabled
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-ink-fade opacity-50 cursor-not-allowed"
            >
              Próxima
              <ChevronRightIcon className="w-4 h-4" />
            </span>
          ) : (
            <Link
              href={nextHref}
              rel="next"
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
            >
              Próxima
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
