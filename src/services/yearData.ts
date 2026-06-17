import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import type { Database } from "@/utils/typings/supabase";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
type Country = Database["public"]["Enums"]["country"];
type PurchaseOrigin = Database["public"]["Enums"]["purchase_origin"];

// =============================================================================
// Tipos públicos
// =============================================================================

export type TopBookOfYear = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  rating: number | null;
  is_favorite: boolean;
  finish_date: string;
};

/**
 * Marco de leitura no ano. Cada entrada é um livro que disparou um milestone
 * (10º livro do ano, 10k páginas, primeira 5★, etc.). Calculado em ordem
 * cronológica por finish_date, então o card pode mostrar a sequência de
 * conquistas conforme o ano avançou.
 */
export type Milestone = {
  kind: "books" | "pages" | "first_five_star";
  /** Texto curto: "25º livro do ano", "10k páginas no ano", etc. */
  label: string;
  date: string;
  book_title: string;
  book_slug: string;
};

/**
 * Leitura que não está "lida" mas tocou o ano — em curso, pausada ou
 * abandonada. Vai pro painel "Em outras estradas" (separado da linha do
 * tempo, que agora só lista os finalizados).
 */
export type OtherReadingItem = {
  reading_id: string;
  book_id: string;
  book_slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  start_date: string | null;
  current_page: number | null;
  pages_total: number | null;
  /** Data relevante pro card:
   *   - "reading" → start_date (quando começou)
   *   - "paused"  → data do último evento `paused`
   *   - "abandoned" → finish_date (data do abandono) */
  reference_date: string | null;
};

export type OtherReadings = {
  reading: OtherReadingItem[];
  paused: OtherReadingItem[];
  abandoned: OtherReadingItem[];
};

export type AcquisitionItem = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  purchase_origin: PurchaseOrigin | null;
  purchase_price: number | null;
  acquired_at: string;
  subscription: { id: string; name: string } | null;
  /**
   * Quando este livro divide o mesmo exemplar físico com outro (`bundled_with`),
   * o item "secundário" do bundle tem `purchase_price = null` (pra não inflar
   * a soma) e `bundle_with_title` apontando pro título do "primário" — assim
   * a UI pode mostrar "mesmo exemplar de X" em vez do preço.
   */
  bundle_with_title: string | null;
};

export type AcquisitionsBreakdown = {
  total_count: number;
  total_spent: number | null;
  by_origin: { origin: PurchaseOrigin; count: number }[];
  /** Lista detalhada das aquisições do ano, ordenada por `acquired_at desc`.
   *  Usado pelo modal "Ver todos" no /year (sessão 17.2.5). */
  items: AcquisitionItem[];
};

export type CountryEntry = {
  country: Country;
  count: number;
};

export type FavoriteQuote = {
  id: string;
  text: string;
  author_name: string | null;
  book_title: string | null;
  book_slug: string | null;
};

export type TimelineReading = {
  reading_id: string;
  book_id: string;
  book_slug: string;
  title: string;
  author_name: string | null;
  rating: number | null;
  start_day: number;
  end_day: number;
  status_at_end:
    | "finished"
    | "paused"
    | "abandoned"
    | "continues_next_month";
  came_from_previous_year: boolean;
  /**
   * Onde essa fatia de leitura cai dentro do mês:
   *  - "self_contained": começou e terminou neste mês (caso típico).
   *  - "starts_here":    começou neste mês, continua nos seguintes.
   *  - "ends_here":      começou em mês anterior, terminou neste.
   *  - "ongoing":        atravessa o mês sem começar nem terminar aqui — vira
   *                      um chip no header em vez de linha vertical.
   */
  slice_kind: "self_contained" | "starts_here" | "ends_here" | "ongoing";
  pages_read: number | null;
  duration_days: number | null;
  color_index: number;
};

export type MonthlyTimeline = {
  month: number; // 1-12
  has_readings: boolean;
  book_count: number;
  is_best_month: boolean;
  readings: TimelineReading[];
};

export type YearData = {
  year: number;
  available_years: number[];

  total_books_finished: number;
  total_pages_read: number;

  records: {
    best_month: {
      month: number;
      book_count: number;
      page_count: number;
    } | null;
    longest_book: { title: string; slug: string; days: number } | null;
    fastest_book: { title: string; slug: string; days: number } | null;
  };

  top_books: TopBookOfYear[];
  milestones: Milestone[];
  other_readings: OtherReadings;
  acquisitions: AcquisitionsBreakdown;
  countries: CountryEntry[];
  favorite_quote: FavoriteQuote | null;
  monthly_timeline: MonthlyTimeline[];

  footer_stats: {
    paused_count: number;
    abandoned_count: number;
    new_authors_count: number;
  };
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Formata uma `Date` em `YYYY-MM-DD` em horário local. Mesma função usada em
 * homeData; replicada aqui pra evitar import cross-service.
 */
function formatLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / 86_400_000),
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isCurrentYear(year: number): boolean {
  return year === new Date().getFullYear();
}

/**
 * Último mês visível pra esse ano. Ano corrente: até mês atual. Anos
 * passados/futuros: sempre 12.
 */
function lastMonthForYear(year: number): number {
  if (!isCurrentYear(year)) return 12;
  return new Date().getMonth() + 1;
}

// =============================================================================
// Sub-fetchers
// =============================================================================

async function fetchAvailableYears(
  supabase: SupabaseServer,
  userId: string,
): Promise<number[]> {
  const { data } = await supabase
    .from("reading")
    .select("finish_date")
    .eq("user_id", userId)
    .eq("status", "finished")
    .not("finish_date", "is", null);

  const years = new Set<number>();
  for (const row of data ?? []) {
    if (!row.finish_date) continue;
    const y = new Date(row.finish_date).getUTCFullYear();
    if (Number.isFinite(y)) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

type FinishedRaw = {
  id: string;
  start_date: string | null;
  finish_date: string | null;
  rating: number | null;
  current_page: number | null;
  book: {
    id: string;
    slug: string;
    title: string;
    pages: number | null;
    is_favorite: boolean;
    cover: string | null;
    book_author: { author: { name: string } | null }[] | null;
  } | null;
};

/**
 * Carrega todas as readings finished do user no ano, com book join. Reaproveitada
 * por `fetchYearTotals`, `fetchRecords`, `fetchTopBooks` — evita 3 round-trips.
 */
async function fetchFinishedReadings(
  supabase: SupabaseServer,
  userId: string,
  year: number,
): Promise<FinishedRaw[]> {
  const { data } = await supabase
    .from("reading")
    .select(
      `id, start_date, finish_date, rating, current_page,
       book:book_id(id, slug, title, pages, is_favorite, cover,
         book_author(author(name)))`,
    )
    .eq("user_id", userId)
    .eq("status", "finished")
    .gte("finish_date", `${year}-01-01`)
    .lte("finish_date", `${year}-12-31`);

  return (data as unknown as FinishedRaw[] | null) ?? [];
}

function computeYearTotals(
  rows: FinishedRaw[],
): { books: number; pages: number } {
  const books = rows.length;
  const pages = rows.reduce((acc, r) => acc + (r.book?.pages ?? 0), 0);
  return { books, pages };
}

function computeRecords(rows: FinishedRaw[]): YearData["records"] {
  if (rows.length === 0) {
    return { best_month: null, longest_book: null, fastest_book: null };
  }

  // best_month: maior count de readings finished. Tie-break: mais páginas.
  const monthAgg = new Map<number, { count: number; pages: number }>();
  for (const r of rows) {
    if (!r.finish_date) continue;
    const month = new Date(r.finish_date).getUTCMonth() + 1;
    const cur = monthAgg.get(month) ?? { count: 0, pages: 0 };
    cur.count += 1;
    cur.pages += r.book?.pages ?? 0;
    monthAgg.set(month, cur);
  }
  let bestMonth: { month: number; book_count: number; page_count: number } | null =
    null;
  for (const [m, agg] of monthAgg) {
    if (
      !bestMonth ||
      agg.count > bestMonth.book_count ||
      (agg.count === bestMonth.book_count && agg.pages > bestMonth.page_count)
    ) {
      bestMonth = { month: m, book_count: agg.count, page_count: agg.pages };
    }
  }

  // longest / fastest: precisa de start_date (sem ele, ignora). Mín 1 dia.
  let longest: { title: string; slug: string; days: number } | null = null;
  let fastest: { title: string; slug: string; days: number } | null = null;
  for (const r of rows) {
    if (!r.start_date || !r.finish_date || !r.book) continue;
    const start = new Date(r.start_date);
    const end = new Date(r.finish_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    if (end < start) continue;
    const days = daysBetween(start, end);
    if (!longest || days > longest.days) {
      longest = { title: r.book.title, slug: r.book.slug, days };
    }
    if (!fastest || days < fastest.days) {
      fastest = { title: r.book.title, slug: r.book.slug, days };
    }
  }

  return { best_month: bestMonth, longest_book: longest, fastest_book: fastest };
}

function computeTopBooks(rows: FinishedRaw[]): TopBookOfYear[] {
  const candidates = rows.filter(
    (r) => r.book && r.finish_date && (r.rating === 5 || r.book.is_favorite),
  );
  candidates.sort((a, b) =>
    (b.finish_date ?? "").localeCompare(a.finish_date ?? ""),
  );
  return candidates.slice(0, 3).map((r) => {
    const book = r.book!;
    const author =
      book.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null;
    return {
      id: book.id,
      slug: book.slug,
      title: book.title,
      author_name: author,
      cover_url: book.cover ? imagesUrl(book.cover) : null,
      rating: r.rating,
      is_favorite: book.is_favorite,
      finish_date: r.finish_date!,
    };
  });
}

/**
 * Marcos de leitura: deriva uma lista de "conquistas numéricas" a partir das
 * finished readings do ano, em ordem cronológica de finish_date.
 *
 * Categorias:
 *  - books:  10º / 25º / 50º / 100º / 150º / 200º livro do ano
 *  - pages:  5k / 10k / 25k / 50k / 100k páginas no ano (cruza o limiar)
 *  - first_five_star: primeira leitura 5★ do ano
 *
 * Cada milestone aponta pro livro que disparou (o que cruzou o threshold).
 */
function computeMilestones(rows: FinishedRaw[]): Milestone[] {
  const sorted = rows
    .filter((r) => r.finish_date && r.book)
    .slice()
    .sort((a, b) => (a.finish_date ?? "").localeCompare(b.finish_date ?? ""));

  const BOOK_TARGETS = [10, 25, 50, 100, 150, 200];
  const PAGE_TARGETS = [5000, 10000, 25000, 50000, 100000];

  const milestones: Milestone[] = [];
  let bookCount = 0;
  let pageCount = 0;
  let firstFiveStarRecorded = false;

  for (const r of sorted) {
    bookCount += 1;
    const prevPageCount = pageCount;
    pageCount += r.book?.pages ?? 0;
    const date = r.finish_date as string;
    const title = r.book!.title;
    const slug = r.book!.slug;

    for (const target of BOOK_TARGETS) {
      if (bookCount === target) {
        milestones.push({
          kind: "books",
          label: `${target}º livro do ano`,
          date,
          book_title: title,
          book_slug: slug,
        });
      }
    }

    for (const target of PAGE_TARGETS) {
      if (prevPageCount < target && pageCount >= target) {
        milestones.push({
          kind: "pages",
          label: `${target / 1000}k páginas no ano`,
          date,
          book_title: title,
          book_slug: slug,
        });
      }
    }

    if (!firstFiveStarRecorded && r.rating === 5) {
      firstFiveStarRecorded = true;
      milestones.push({
        kind: "first_five_star",
        label: "Primeira leitura 5★ do ano",
        date,
        book_title: title,
        book_slug: slug,
      });
    }
  }

  milestones.sort((a, b) => a.date.localeCompare(b.date));
  return milestones;
}

type OtherReadingRaw = {
  id: string;
  status: Database["public"]["Enums"]["reading_status"];
  start_date: string | null;
  finish_date: string | null;
  current_page: number | null;
  book: {
    id: string;
    slug: string;
    title: string;
    pages: number | null;
    cover: string | null;
    book_author: { author: { name: string } | null }[] | null;
  } | null;
  reading_event: { event_type: string; event_date: string }[] | null;
};

/**
 * Leituras que tocaram o ano mas não terminaram — em curso, pausadas no ano,
 * abandonadas no ano. Vai pro card "Em outras estradas" separado da linha
 * do tempo (que agora lista só os concluídos).
 *
 * Critérios:
 *  - reading:   status='reading', start_date <= year-end. Mostra mesmo se
 *               começou em anos anteriores — é "em curso" hoje.
 *  - paused:    status='paused' E tem evento `paused` cuja event_date cai
 *               neste ano.
 *  - abandoned: status='abandoned' E finish_date cai neste ano.
 */
async function fetchOtherReadings(
  supabase: SupabaseServer,
  userId: string,
  year: number,
): Promise<OtherReadings> {
  const yearStartISO = `${year}-01-01`;
  const yearEndISO = `${year}-12-31`;

  const { data } = await supabase
    .from("reading")
    .select(
      `id, status, start_date, finish_date, current_page,
       book:book_id(id, slug, title, pages, cover,
         book_author(author(name))),
       reading_event(event_type, event_date)`,
    )
    .eq("user_id", userId)
    .in("status", ["reading", "paused", "abandoned"]);

  const result: OtherReadings = { reading: [], paused: [], abandoned: [] };

  for (const r of (data as unknown as OtherReadingRaw[] | null) ?? []) {
    if (!r.book) continue;
    const author =
      r.book.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null;
    const cover_url = r.book.cover ? imagesUrl(r.book.cover) : null;
    const baseItem: Omit<OtherReadingItem, "reference_date"> = {
      reading_id: r.id,
      book_id: r.book.id,
      book_slug: r.book.slug,
      title: r.book.title,
      author_name: author,
      cover_url,
      start_date: r.start_date,
      current_page: r.current_page,
      pages_total: r.book.pages,
    };

    if (r.status === "reading") {
      // Inclui qualquer "em curso" cujo início é até o fim do ano (mesmo
      // que tenha começado em ano anterior — segue valendo "está rolando").
      if (r.start_date && r.start_date <= yearEndISO) {
        result.reading.push({ ...baseItem, reference_date: r.start_date });
      }
    } else if (r.status === "paused") {
      const lastPaused = (r.reading_event ?? [])
        .filter((e) => e.event_type === "paused")
        .map((e) => e.event_date)
        .sort()
        .pop();
      if (lastPaused && lastPaused >= yearStartISO && lastPaused <= yearEndISO) {
        result.paused.push({ ...baseItem, reference_date: lastPaused });
      }
    } else if (r.status === "abandoned") {
      if (
        r.finish_date &&
        r.finish_date >= yearStartISO &&
        r.finish_date <= yearEndISO
      ) {
        result.abandoned.push({ ...baseItem, reference_date: r.finish_date });
      }
    }
  }

  // Mais recente primeiro em cada coluna.
  for (const arr of [result.reading, result.paused, result.abandoned]) {
    arr.sort((a, b) =>
      (b.reference_date ?? "").localeCompare(a.reference_date ?? ""),
    );
  }

  return result;
}

type AcquisitionRaw = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  purchase_origin: PurchaseOrigin | null;
  purchase_price: number | null;
  acquired_at: string;
  bundled_with: string[] | null;
  subscription: { id: string; name: string } | null;
  book_author: { author: { name: string } | null }[] | null;
};

async function fetchAcquisitions(
  supabase: SupabaseServer,
  userId: string,
  year: number,
): Promise<AcquisitionsBreakdown> {
  const { data } = await supabase
    .from("book")
    .select(
      `id, slug, title, cover, purchase_origin, purchase_price, acquired_at,
       bundled_with,
       subscription(id, name),
       book_author(author(name))`,
    )
    .eq("user_id", userId)
    .gte("acquired_at", `${year}-01-01`)
    .lte("acquired_at", `${year}-12-31`)
    .order("acquired_at", { ascending: false });

  const rows = (data as unknown as AcquisitionRaw[] | null) ?? [];

  // Identifica bundles dentro do recorte do ano: livros que dividem o mesmo
  // exemplar físico (`bundled_with`). Em cada componente conexo, elege um
  // "primário" que carrega o preço; os demais ficam como secundários (price
  // nulo + título do primário pra exibir "mesmo exemplar de …"). Isso evita
  // que o user veja o preço repetido em cada volume do omnibus e que o total
  // some duas vezes o mesmo pagamento.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const primaryOf = new Map<string, string>(); // bookId → primaryId
  const titleByPrimary = new Map<string, string>();
  const seen = new Set<string>();

  for (const r of rows) {
    if (seen.has(r.id)) continue;
    const group: AcquisitionRaw[] = [];
    const stack: string[] = [r.id];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (cur === undefined || seen.has(cur)) continue;
      seen.add(cur);
      const node = byId.get(cur);
      if (!node) continue;
      group.push(node);
      for (const nb of node.bundled_with ?? []) {
        if (byId.has(nb) && !seen.has(nb)) stack.push(nb);
      }
    }
    if (group.length <= 1) continue;

    // Primário: o livro do grupo com preço E menor id (estável). Sem preço
    // em nenhum, cai no menor id mesmo assim — pra que os secundários tenham
    // pra onde apontar no rótulo.
    const withPrice = group.filter((b) => b.purchase_price !== null);
    const pool = withPrice.length > 0 ? withPrice : group;
    const primary = [...pool].sort((a, b) => a.id.localeCompare(b.id))[0];
    for (const b of group) primaryOf.set(b.id, primary.id);
    titleByPrimary.set(primary.id, primary.title);
  }

  const byOrigin = new Map<PurchaseOrigin, number>();
  let totalSpent: number | null = null;
  const items: AcquisitionItem[] = [];

  for (const b of rows) {
    if (b.purchase_origin) {
      byOrigin.set(
        b.purchase_origin,
        (byOrigin.get(b.purchase_origin) ?? 0) + 1,
      );
    }

    const primaryId = primaryOf.get(b.id);
    const isSecondary = primaryId !== undefined && primaryId !== b.id;
    const priceForItem =
      !isSecondary && b.purchase_price !== null
        ? Number(b.purchase_price)
        : null;
    const bundleWithTitle = isSecondary
      ? titleByPrimary.get(primaryId) ?? null
      : null;

    if (priceForItem !== null) {
      totalSpent = (totalSpent ?? 0) + priceForItem;
    }

    items.push({
      id: b.id,
      slug: b.slug,
      title: b.title,
      author_name:
        b.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null,
      cover_url: b.cover ? imagesUrl(b.cover) : null,
      purchase_origin: b.purchase_origin,
      purchase_price: priceForItem,
      acquired_at: b.acquired_at,
      subscription: b.subscription,
      bundle_with_title: bundleWithTitle,
    });
  }

  return {
    total_count: rows.length,
    total_spent: totalSpent,
    by_origin: [...byOrigin.entries()]
      .map(([origin, count]) => ({ origin, count }))
      .sort((a, b) => b.count - a.count),
    items,
  };
}

async function fetchCountries(
  supabase: SupabaseServer,
  userId: string,
  year: number,
): Promise<CountryEntry[]> {
  // Authors dos books finished no ano. Group by author.country, count distinct.
  const { data } = await supabase
    .from("reading")
    .select(
      `book:book_id(book_author(author(id, country)))`,
    )
    .eq("user_id", userId)
    .eq("status", "finished")
    .gte("finish_date", `${year}-01-01`)
    .lte("finish_date", `${year}-12-31`);

  type Raw = {
    book: {
      book_author:
        | { author: { id: string; country: Country | null } | null }[]
        | null;
    } | null;
  };
  const countByCountry = new Map<Country, Set<string>>();
  for (const r of (data as unknown as Raw[] | null) ?? []) {
    for (const ba of r.book?.book_author ?? []) {
      const a = ba.author;
      if (!a?.country) continue;
      const set = countByCountry.get(a.country) ?? new Set<string>();
      set.add(a.id);
      countByCountry.set(a.country, set);
    }
  }
  return [...countByCountry.entries()]
    .map(([country, set]) => ({ country, count: set.size }))
    .sort((a, b) => b.count - a.count);
}

async function fetchFavoriteQuote(
  supabase: SupabaseServer,
  userId: string,
  year: number,
): Promise<FavoriteQuote | null> {
  type QuoteRaw = {
    id: string;
    text: string;
    author_name: string | null;
    is_favorite: boolean;
    created_at: string;
    book: { title: string; slug: string } | null;
  };
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31T23:59:59.999Z`;

  // Tentativa 1: quote com is_favorite=true criada no ano (mais recente).
  const { data: favData } = await supabase
    .from("quote")
    .select(`id, text, author_name, is_favorite, created_at, book:book_id(title, slug)`)
    .eq("user_id", userId)
    .eq("is_favorite", true)
    .gte("created_at", yearStart)
    .lte("created_at", yearEnd)
    .order("created_at", { ascending: false })
    .limit(1);

  let q = ((favData as unknown as QuoteRaw[] | null) ?? [])[0] ?? null;

  // Fallback: quote mais antiga criada no ano.
  if (!q) {
    const { data: anyData } = await supabase
      .from("quote")
      .select(`id, text, author_name, is_favorite, created_at, book:book_id(title, slug)`)
      .eq("user_id", userId)
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)
      .order("created_at", { ascending: true })
      .limit(1);
    q = ((anyData as unknown as QuoteRaw[] | null) ?? [])[0] ?? null;
  }

  if (!q) return null;

  return {
    id: q.id,
    text: q.text,
    author_name: q.author_name,
    book_title: q.book?.title ?? null,
    book_slug: q.book?.slug ?? null,
  };
}

// =============================================================================
// Monthly timeline — mais complexo (Fase 2 do briefing)
// =============================================================================

type TimelineReadingRaw = {
  id: string;
  status: Database["public"]["Enums"]["reading_status"];
  start_date: string | null;
  finish_date: string | null;
  rating: number | null;
  current_page: number | null;
  book: {
    id: string;
    slug: string;
    title: string;
    pages: number | null;
    book_author: { author: { name: string } | null }[] | null;
  } | null;
};

/**
 * Sobreposição mensal de readings. Cada reading pode aparecer em vários meses
 * se durou semanas/meses; geramos uma fatia por mês tocado.
 *
 * Edge cases:
 *  - reading sem `start_date`: ignorada (não dá pra plotar).
 *  - reading começou em ano anterior: primeira fatia tem
 *    `came_from_previous_year=true` e start_day=1.
 *  - reading sem `finish_date` mas com status=reading/paused: linha vai até
 *    "agora" (hoje, se ano corrente; 31/dez, se ano passado).
 *  - reading inteira fora do ano: filtrada.
 */
async function fetchMonthlyTimeline(
  supabase: SupabaseServer,
  userId: string,
  year: number,
): Promise<MonthlyTimeline[]> {
  const lastMonth = lastMonthForYear(year);
  const yearStartISO = `${year}-01-01`;
  const yearEndISO = `${year}-12-31`;

  // Query: readings com start_date <= dec-31 E (finish_date null OR finish_date >= jan-01).
  // Postgrest `.or` precisa de string única; faço dois fetches simples e mergeio.
  const [openEndedRes, closedRes] = await Promise.all([
    supabase
      .from("reading")
      .select(
        `id, status, start_date, finish_date, rating, current_page,
         book:book_id(id, slug, title, pages,
           book_author(author(name)))`,
      )
      .eq("user_id", userId)
      .not("start_date", "is", null)
      .lte("start_date", yearEndISO)
      .is("finish_date", null),
    supabase
      .from("reading")
      .select(
        `id, status, start_date, finish_date, rating, current_page,
         book:book_id(id, slug, title, pages,
           book_author(author(name)))`,
      )
      .eq("user_id", userId)
      .not("start_date", "is", null)
      .lte("start_date", yearEndISO)
      .gte("finish_date", yearStartISO),
  ]);

  const all = [
    ...((openEndedRes.data as unknown as TimelineReadingRaw[] | null) ?? []),
    ...((closedRes.data as unknown as TimelineReadingRaw[] | null) ?? []),
  ];

  // Atribui cor cíclica por book.id. Estável entre fatias (mesma reading
  // aparece em vários meses com a mesma cor). Estável entre renders desde que
  // a ordem do `all` seja determinística — está, vem do banco em ordem de id
  // por padrão; aceitável pra essa visualização.
  const colorByBook = new Map<string, number>();
  let nextColor = 0;
  function colorFor(bookId: string): number {
    if (!colorByBook.has(bookId)) {
      colorByBook.set(bookId, nextColor % 8);
      nextColor += 1;
    }
    return colorByBook.get(bookId)!;
  }

  // Buckets por mês. Inicializa todos os meses até `lastMonth`; meses futuros
  // (ano corrente) ficam de fora.
  const monthBuckets = new Map<number, TimelineReading[]>();
  for (let m = 1; m <= lastMonth; m += 1) monthBuckets.set(m, []);

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  const today = new Date();

  for (const r of all) {
    if (!r.book || !r.start_date) continue;
    const start = new Date(r.start_date);
    if (Number.isNaN(start.getTime())) continue;

    // end "efetivo": finish_date se houver; senão hoje (cap no fim do ano se
    // ano passado).
    const rawEnd = r.finish_date ? new Date(r.finish_date) : null;
    const fallbackEnd = isCurrentYear(year) ? today : yearEnd;
    const end = rawEnd ?? fallbackEnd;
    if (Number.isNaN(end.getTime())) continue;
    if (end < yearStart) continue; // reading inteira antes do ano

    const cameFromPrevYear = start.getFullYear() < year;
    const effectiveStart = cameFromPrevYear ? yearStart : start;
    const effectiveEnd = end > yearEnd ? yearEnd : end;

    const startMonth = effectiveStart.getMonth() + 1;
    const endMonth = Math.min(effectiveEnd.getMonth() + 1, lastMonth);

    if (startMonth > lastMonth) continue; // toda fora dos meses visíveis

    const totalDuration = rawEnd ? daysBetween(start, rawEnd) : null;
    // pages_read: prefere `current_page` (se houver) sobre book.pages —
    // current_page é "onde parou" e funciona pra reading/paused; se finished,
    // book.pages é o total real.
    const pagesRead =
      r.finish_date !== null
        ? r.book.pages ?? null
        : r.current_page ?? null;
    const author =
      r.book.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null;
    const colorIndex = colorFor(r.book.id);

    for (let m = startMonth; m <= endMonth; m += 1) {
      const monthFirst = new Date(year, m - 1, 1);
      const monthLast = new Date(year, m - 1, daysInMonth(year, m));

      const sliceStart =
        effectiveStart > monthFirst ? effectiveStart : monthFirst;
      const sliceEnd =
        effectiveEnd < monthLast ? effectiveEnd : monthLast;

      const startDay = sliceStart.getDate();
      const endDay = sliceEnd.getDate();

      const isLastSliceOfReading = m === endMonth;
      const readingActuallyEndsHere =
        isLastSliceOfReading &&
        rawEnd !== null &&
        rawEnd <= yearEnd &&
        rawEnd.getMonth() + 1 === m;

      let statusAtEnd: TimelineReading["status_at_end"];
      if (readingActuallyEndsHere) {
        if (r.status === "abandoned") statusAtEnd = "abandoned";
        else statusAtEnd = "finished";
      } else if (r.status === "paused" && isLastSliceOfReading) {
        statusAtEnd = "paused";
      } else {
        statusAtEnd = "continues_next_month";
      }

      // slice_kind: cataloga a fatia em A/B/C/D pra renderização.
      //  - começa "de verdade" neste mês: é o startMonth E não veio do ano
      //    anterior (caso contrário foi forçado a começar em jan/01).
      //  - termina "de verdade" neste mês: readingActuallyEndsHere (finish_date
      //    presente caindo no mês) ou paused na última fatia visível.
      const startsInThisSlice = m === startMonth && !cameFromPrevYear;
      const endsInThisSlice =
        readingActuallyEndsHere ||
        (r.status === "paused" && isLastSliceOfReading);
      let sliceKind: TimelineReading["slice_kind"];
      if (startsInThisSlice && endsInThisSlice) sliceKind = "self_contained";
      else if (startsInThisSlice) sliceKind = "starts_here";
      else if (endsInThisSlice) sliceKind = "ends_here";
      else sliceKind = "ongoing";

      // Filtro: a timeline mostra só os concluídos. Não-finished aparecem
      // no painel "Em outras estradas".
      if (statusAtEnd !== "finished") continue;

      monthBuckets.get(m)?.push({
        reading_id: r.id,
        book_id: r.book.id,
        book_slug: r.book.slug,
        title: r.book.title,
        author_name: author,
        rating: r.rating,
        start_day: startDay,
        end_day: endDay,
        status_at_end: statusAtEnd,
        came_from_previous_year: cameFromPrevYear && m === startMonth,
        slice_kind: sliceKind,
        pages_read: pagesRead,
        duration_days: totalDuration,
        color_index: colorIndex,
      });
    }
  }

  // is_best_month: maior número de livros únicos no mês. Empate → mês menor
  // ganha (estável, evita "flicker" entre dois meses com mesmo count).
  let bestMonth = 0;
  let bestCount = 0;
  for (const [m, slices] of monthBuckets) {
    const unique = new Set(slices.map((s) => s.book_id)).size;
    if (unique > bestCount) {
      bestCount = unique;
      bestMonth = m;
    }
  }

  const result: MonthlyTimeline[] = [];
  for (let m = 1; m <= lastMonth; m += 1) {
    const slices = monthBuckets.get(m) ?? [];
    const uniqueCount = new Set(slices.map((s) => s.book_id)).size;
    result.push({
      month: m,
      has_readings: uniqueCount > 0,
      book_count: uniqueCount,
      is_best_month: m === bestMonth && bestCount > 0,
      readings: slices,
    });
  }
  return result;
}

// =============================================================================
// Footer stats
// =============================================================================

async function fetchFooterStats(
  supabase: SupabaseServer,
  userId: string,
  year: number,
): Promise<YearData["footer_stats"]> {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // paused_count: distinct readings com event paused no ano.
  // abandoned_count: distinct readings com event abandoned no ano.
  // (Usa reading_event em vez de updated_at — semantica precisa.)
  const [pausedRes, abandonedRes] = await Promise.all([
    supabase
      .from("reading_event")
      .select("reading_id", { count: "exact" })
      .eq("user_id", userId)
      .eq("event_type", "paused")
      .gte("event_date", yearStart)
      .lte("event_date", yearEnd),
    supabase
      .from("reading_event")
      .select("reading_id", { count: "exact" })
      .eq("user_id", userId)
      .eq("event_type", "abandoned")
      .gte("event_date", yearStart)
      .lte("event_date", yearEnd),
  ]);

  const pausedSet = new Set(
    (pausedRes.data ?? []).map((r) => r.reading_id),
  );
  const abandonedSet = new Set(
    (abandonedRes.data ?? []).map((r) => r.reading_id),
  );

  // new_authors_count: autores cuja primeira reading finished do user é no ano.
  // Strategy: pega todas as readings finished do user com book_author; agrupa
  // por author, pega min(finish_date), conta os com year(min) === year.
  const { data: authorRows } = await supabase
    .from("reading")
    .select(
      `finish_date, book:book_id(book_author(author(id)))`,
    )
    .eq("user_id", userId)
    .eq("status", "finished")
    .not("finish_date", "is", null);

  type AuthorJoinRaw = {
    finish_date: string;
    book: {
      book_author: { author: { id: string } | null }[] | null;
    } | null;
  };
  const firstFinishByAuthor = new Map<string, string>();
  for (const r of (authorRows as unknown as AuthorJoinRaw[] | null) ?? []) {
    const fd = r.finish_date;
    for (const ba of r.book?.book_author ?? []) {
      const id = ba.author?.id;
      if (!id) continue;
      const cur = firstFinishByAuthor.get(id);
      if (!cur || fd < cur) firstFinishByAuthor.set(id, fd);
    }
  }
  let newAuthors = 0;
  for (const fd of firstFinishByAuthor.values()) {
    if (fd >= yearStart && fd <= yearEnd) newAuthors += 1;
  }

  return {
    paused_count: pausedSet.size,
    abandoned_count: abandonedSet.size,
    new_authors_count: newAuthors,
  };
}

// =============================================================================
// Entrypoint
// =============================================================================

export async function getYearData(
  year: number,
  userId: string,
): Promise<YearData> {
  const startedAt = Date.now();
  const supabase = await createClient();

  const [
    availableYears,
    finishedRows,
    otherReadings,
    acquisitions,
    countries,
    favoriteQuote,
    monthlyTimeline,
    footerStats,
  ] = await Promise.all([
    fetchAvailableYears(supabase, userId),
    fetchFinishedReadings(supabase, userId, year),
    fetchOtherReadings(supabase, userId, year),
    fetchAcquisitions(supabase, userId, year),
    fetchCountries(supabase, userId, year),
    fetchFavoriteQuote(supabase, userId, year),
    fetchMonthlyTimeline(supabase, userId, year),
    fetchFooterStats(supabase, userId, year),
  ]);

  const totals = computeYearTotals(finishedRows);
  const records = computeRecords(finishedRows);
  const topBooks = computeTopBooks(finishedRows);
  const milestones = computeMilestones(finishedRows);

  console.log(`[yearData] year=${year} took ${Date.now() - startedAt}ms`);

  return {
    year,
    available_years: availableYears,
    total_books_finished: totals.books,
    total_pages_read: totals.pages,
    records,
    top_books: topBooks,
    milestones,
    other_readings: otherReadings,
    acquisitions,
    countries,
    favorite_quote: favoriteQuote,
    monthly_timeline: monthlyTimeline,
    footer_stats: footerStats,
  };
}
