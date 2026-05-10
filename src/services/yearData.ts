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

export type Achievement =
  | {
      kind: "challenge";
      id: string;
      slug: string;
      name: string;
      completed_month: number;
    }
  | {
      kind: "series";
      id: string;
      slug: string;
      name: string;
      finished_month: number;
    }
  | {
      kind: "subscription";
      id: string;
      slug: string;
      name: string;
      months_active: number;
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
  achievements: Achievement[];
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

async function fetchAchievements(
  supabase: SupabaseServer,
  userId: string,
  year: number,
): Promise<Achievement[]> {
  const result: Achievement[] = [];

  // 1. Challenges concluídos no ano (`completed_at` populado em sessão 15.1).
  const { data: challenges } = await supabase
    .from("collection")
    .select("id, slug, name, completed_at")
    .eq("user_id", userId)
    .eq("type", "challenge")
    .not("completed_at", "is", null)
    .gte("completed_at", `${year}-01-01`)
    .lte("completed_at", `${year}-12-31T23:59:59.999Z`)
    .order("completed_at", { ascending: false });

  for (const c of challenges ?? []) {
    if (!c.completed_at) continue;
    result.push({
      kind: "challenge",
      id: c.id,
      slug: c.slug,
      name: c.name,
      completed_month: new Date(c.completed_at).getUTCMonth() + 1,
    });
  }

  // 2. Séries finalizadas no ano via `serie.finish_date`.
  const { data: series } = await supabase
    .from("serie")
    .select("id, slug, name, finish_date")
    .eq("user_id", userId)
    .eq("status", "finished")
    .not("finish_date", "is", null)
    .gte("finish_date", `${year}-01-01`)
    .lte("finish_date", `${year}-12-31`)
    .order("finish_date", { ascending: false });

  for (const s of series ?? []) {
    if (!s.finish_date) continue;
    result.push({
      kind: "series",
      id: s.id,
      slug: s.slug,
      name: s.name,
      finished_month: new Date(s.finish_date).getUTCMonth() + 1,
    });
  }

  // 3. Subscriptions com items added_at no ano. months_active = count distinct
  //    (year, month) dos added_at. Pra simplificar, fetch dos collection_item
  //    de cada subscription e agrupa em memória — datasets pequenos.
  const { data: subs } = await supabase
    .from("collection")
    .select(
      `id, slug, name,
       collection_item(added_at)`,
    )
    .eq("user_id", userId)
    .eq("type", "subscription");

  type SubRaw = {
    id: string;
    slug: string;
    name: string;
    collection_item: { added_at: string }[] | null;
  };
  for (const s of (subs as unknown as SubRaw[] | null) ?? []) {
    const months = new Set<number>();
    for (const item of s.collection_item ?? []) {
      const d = new Date(item.added_at);
      if (d.getUTCFullYear() === year) months.add(d.getUTCMonth() + 1);
    }
    if (months.size === 0) continue;
    result.push({
      kind: "subscription",
      id: s.id,
      slug: s.slug,
      name: s.name,
      months_active: months.size,
    });
  }

  // Sort: challenge > series > subscription; entre iguais, mais recente primeiro.
  const kindOrder: Record<Achievement["kind"], number> = {
    challenge: 0,
    series: 1,
    subscription: 2,
  };
  result.sort((a, b) => {
    if (a.kind !== b.kind) return kindOrder[a.kind] - kindOrder[b.kind];
    const am = a.kind === "subscription" ? 0 : (a as { completed_month?: number; finished_month?: number }).completed_month ?? (a as { finished_month?: number }).finished_month ?? 0;
    const bm = b.kind === "subscription" ? 0 : (b as { completed_month?: number; finished_month?: number }).completed_month ?? (b as { finished_month?: number }).finished_month ?? 0;
    return bm - am;
  });

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
       subscription(id, name),
       book_author(author(name))`,
    )
    .eq("user_id", userId)
    .gte("acquired_at", `${year}-01-01`)
    .lte("acquired_at", `${year}-12-31`)
    .order("acquired_at", { ascending: false });

  const rows = (data as unknown as AcquisitionRaw[] | null) ?? [];
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
    if (b.purchase_price !== null) {
      totalSpent = (totalSpent ?? 0) + Number(b.purchase_price);
    }
    items.push({
      id: b.id,
      slug: b.slug,
      title: b.title,
      author_name:
        b.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null,
      cover_url: b.cover ? imagesUrl(b.cover) : null,
      purchase_origin: b.purchase_origin,
      purchase_price:
        b.purchase_price !== null ? Number(b.purchase_price) : null,
      acquired_at: b.acquired_at,
      subscription: b.subscription,
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
    achievements,
    acquisitions,
    countries,
    favoriteQuote,
    monthlyTimeline,
    footerStats,
  ] = await Promise.all([
    fetchAvailableYears(supabase, userId),
    fetchFinishedReadings(supabase, userId, year),
    fetchAchievements(supabase, userId, year),
    fetchAcquisitions(supabase, userId, year),
    fetchCountries(supabase, userId, year),
    fetchFavoriteQuote(supabase, userId, year),
    fetchMonthlyTimeline(supabase, userId, year),
    fetchFooterStats(supabase, userId, year),
  ]);

  const totals = computeYearTotals(finishedRows);
  const records = computeRecords(finishedRows);
  const topBooks = computeTopBooks(finishedRows);

  console.log(`[yearData] year=${year} took ${Date.now() - startedAt}ms`);

  return {
    year,
    available_years: availableYears,
    total_books_finished: totals.books,
    total_pages_read: totals.pages,
    records,
    top_books: topBooks,
    achievements,
    acquisitions,
    countries,
    favorite_quote: favoriteQuote,
    monthly_timeline: monthlyTimeline,
    footer_stats: footerStats,
  };
}
