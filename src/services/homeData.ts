import { createClient } from "@/utils/supabase/server";
import { collectionListQuery } from "@/services/collectionList";
import { imagesUrl } from "@/services/images";
import type { Database } from "@/utils/typings/supabase";

type CollectionType = Database["public"]["Enums"]["collection_type"];

export type ReadingNowItem = {
  id: string;
  reading_id: string;
  slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  current_page: number;
  pages_count: number;
  progress_percent: number;
};

export type HomePace = "moss" | "gold" | "burgundy";

export type HomeActiveChallenge = {
  id: string;
  slug: string;
  name: string;
  goal_count: number;
  current_count: number;
  progress_percent: number;
  pace_label: string;
  pace_color: HomePace;
  pace_subtitle: string;
};

export type HeatmapCell = {
  date: string; // ISO YYYY-MM-DD
  pages_delta: number;
  /** Sessão 17.10: quantos livros foram finalizados nesse dia. Renderiza
   *  como dot moss no canto superior direito da cell no heatmap. */
  finished_books: number;
};

export type HomeHeatmap = {
  cells: HeatmapCell[];
  total_pages: number;
  total_days_with_progress: number;
  average_pages_per_day: number;
};

/**
 * `format` aqui é o `book_format` enum vindo de `reading.format`. Quando a
 * reading não tem format setado, fallback pro primeiro de `book.formats_owned`
 * — se nem isso existir, vira "unknown" (label "Outro").
 */
export type FormatDistribution = {
  format: string;
  count: number;
  percent: number;
};

/**
 * "Gênero" no projeto = `category.name` (lista N:N via `book_category`). Como
 * um livro pode ter múltiplas categorias, o agrupamento aqui é por
 * **atribuição** (cada par reading×categoria conta como 1). Soma das
 * percentages bate em 100%, mesmo com livros multi-categoria. Livros sem
 * categoria entram em "Sem gênero" (1 atribuição por reading sem tag).
 */
export type GenreDistribution = {
  genre: string;
  /** Slug da categoria pra navegar pra /category/[slug]. `null` quando o
   *  "gênero" é o pseudo-bucket "Sem gênero" (livros sem categoria). */
  slug: string | null;
  count: number;
  percent: number;
};

export type PaceTrend = "up" | "down" | "stable";

export type PaceSparkline = {
  values: number[]; // 30 entries, ordem cronológica (mais antigo → hoje)
  average_per_day: number;
  trend: PaceTrend;
};

export type TopAuthor = {
  id: string;
  slug: string;
  name: string;
  book_count: number;
};

export type RatingBucket = {
  rating: 1 | 2 | 3 | 4 | 5;
  count: number;
};

/**
 * Sugestão de próxima leitura. `origin` indica a regra que selecionou esse
 * livro; o `origin_label` é o texto pronto exibido no card.
 *  - priority_high   → book.priority === 'high', e ainda TBR
 *  - priority_medium → book.priority === 'medium', e ainda TBR
 *  - series_next     → próximo volume TBR de série já em curso (com pelo menos
 *                      um livro `finished`).
 * "TBR" = sem `reading` ou todas as readings sem status active/finished.
 */
export type NextReadOrigin =
  | "priority_high"
  | "priority_medium"
  | "series_next";

export type NextReadItem = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  origin: NextReadOrigin;
  origin_label: string;
};

export type FavoriteCollection = {
  id: string;
  slug: string;
  name: string;
  type: CollectionType;
  progress_percent: number; // 0-100
  subtitle: string;
  is_completed: boolean;
};

export type QuoteForCarousel = {
  id: string;
  slug: string;
  text: string;
  author_name: string | null;
  book_title: string | null;
  book_slug: string | null;
};

export type RecentlyFinishedBook = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  finish_date: string;
};

export type HomeData = {
  user_name: string | null;
  current_year: number;
  today: string;

  reading_now: ReadingNowItem[];
  last_activity: {
    book_title: string;
    book_slug: string;
    relative_time: string;
  } | null;

  stats: {
    books_finished: number;
    pages_read: number;
    books_per_month: number;
    avg_rating: number | null;
    quotes_count: number;
    authors_count: number;
  };

  active_challenge: HomeActiveChallenge | null;

  books_per_month_chart: {
    month: number;
    count: number;
    books: { id: string; slug: string; title: string; finish_date: string }[];
  }[];

  heatmap: HomeHeatmap;

  format_distribution: FormatDistribution[];
  genre_distribution: GenreDistribution[];
  pace_sparkline: PaceSparkline;

  top_authors: TopAuthor[];
  rating_distribution: RatingBucket[];

  next_reads: NextReadItem[];
  favorite_collections: FavoriteCollection[];

  random_quotes: QuoteForCarousel[];
  recently_finished: RecentlyFinishedBook[];
};

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

function formatRelativeTime(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? "mês" : "meses"}`;
}

type ReadingNowRaw = {
  id: string;
  current_page: number | null;
  updated_at: string;
  book: {
    id: string;
    title: string;
    slug: string;
    cover: string | null;
    pages: number | null;
    book_author: { author: { name: string } | null }[] | null;
  } | null;
};

async function fetchReadingNow(
  supabase: SupabaseServer,
  userId: string,
): Promise<ReadingNowItem[]> {
  const { data } = await supabase
    .from("reading")
    .select(
      `id, current_page, updated_at,
       book:book_id(id, title, slug, cover, pages,
         book_author(author(name)))`,
    )
    .eq("user_id", userId)
    .eq("status", "reading")
    .order("updated_at", { ascending: false })
    .limit(2);

  return ((data as unknown as ReadingNowRaw[] | null) ?? [])
    .map((r): ReadingNowItem | null => {
      if (!r.book) return null;
      const pages = r.book.pages ?? 0;
      const current = r.current_page ?? 0;
      const progress =
        pages > 0 ? Math.min(100, Math.round((current / pages) * 100)) : 0;
      const firstAuthor =
        r.book.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null;
      return {
        id: r.book.id,
        reading_id: r.id,
        slug: r.book.slug,
        title: r.book.title,
        author_name: firstAuthor,
        cover_url: r.book.cover ? imagesUrl(r.book.cover) : null,
        current_page: current,
        pages_count: pages,
        progress_percent: progress,
      };
    })
    .filter((x): x is ReadingNowItem => x !== null);
}

type LastActivityRaw = {
  updated_at: string;
  book: { title: string; slug: string } | null;
};

async function fetchLastActivity(
  supabase: SupabaseServer,
  userId: string,
): Promise<HomeData["last_activity"]> {
  const { data } = await supabase
    .from("reading")
    .select(`updated_at, book:book_id(title, slug)`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as unknown as LastActivityRaw | null;
  if (!row || !row.book) return null;
  return {
    book_title: row.book.title,
    book_slug: row.book.slug,
    relative_time: formatRelativeTime(row.updated_at),
  };
}

type FinishedReadingRaw = {
  rating: number | null;
  book: {
    pages: number | null;
    book_author: { author_id: string }[] | null;
  } | null;
};

async function fetchYearStats(
  supabase: SupabaseServer,
  userId: string,
  currentYear: number,
  monthsElapsed: number,
): Promise<HomeData["stats"]> {
  const [{ data: finishedRaw }, { count: quotesCount }] = await Promise.all([
    supabase
      .from("reading")
      .select(`rating, book:book_id(pages, book_author(author_id))`)
      .eq("user_id", userId)
      .eq("status", "finished")
      .gte("finish_date", `${currentYear}-01-01`)
      .lte("finish_date", `${currentYear}-12-31`),
    supabase
      .from("quote")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const finished = (finishedRaw as unknown as FinishedReadingRaw[] | null) ?? [];

  const books_finished = finished.length;
  const pages_read = finished.reduce(
    (acc, r) => acc + (r.book?.pages ?? 0),
    0,
  );

  const ratings = finished
    .map((r) => r.rating)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avg_rating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

  const distinctAuthors = new Set<string>();
  for (const r of finished) {
    for (const ba of r.book?.book_author ?? []) {
      if (ba.author_id) distinctAuthors.add(ba.author_id);
    }
  }

  const safeMonths = Math.max(1, monthsElapsed);
  const books_per_month =
    Math.round((books_finished / safeMonths) * 10) / 10;

  return {
    books_finished,
    pages_read,
    books_per_month,
    avg_rating,
    quotes_count: quotesCount ?? 0,
    authors_count: distinctAuthors.size,
  };
}

/**
 * Mesmo cálculo usado em CollectionCard (challengeRhythm). Replicado aqui
 * porque a lógica é private do componente client e o homeData roda no server.
 * Se a regra mudar, atualizar nos dois lugares.
 */
function derivePace(
  startDate: string | null,
  endDate: string | null,
  goal: number,
  current: number,
): { label: string; color: HomePace } {
  if (!startDate || !endDate || goal <= 0) {
    return { label: "No ritmo", color: "gold" };
  }
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (end <= start) return { label: "No ritmo", color: "gold" };
  const totalMs = end - start;
  const elapsedMs = Math.max(0, Math.min(totalMs, now - start));
  const timePct = (elapsedMs / totalMs) * 100;
  const readPct = (current / goal) * 100;
  if (readPct >= timePct - 5) return { label: "Ritmo bom", color: "moss" };
  if (timePct > readPct + 15) return { label: "Atrasada", color: "burgundy" };
  return { label: "No ritmo", color: "gold" };
}

function paceSubtitle(
  endDate: string | null,
  goal: number,
  current: number,
): string {
  const remaining = Math.max(0, goal - current);
  if (remaining === 0) return "meta atingida";
  if (!endDate) return `faltam ${remaining}`;
  const now = new Date();
  const end = new Date(endDate);
  const monthsLeft = Math.max(
    0,
    (end.getFullYear() - now.getFullYear()) * 12 +
      (end.getMonth() - now.getMonth()),
  );
  if (monthsLeft <= 0) return `faltam ${remaining} · prazo encerrando`;
  const rate = Math.ceil(remaining / monthsLeft);
  const monthsLabel = monthsLeft === 1 ? "mês" : "meses";
  return `faltam ${remaining} em ${monthsLeft} ${monthsLabel} · ~${rate}/mês`;
}

async function fetchActiveChallenge(
  currentYear: number,
): Promise<HomeActiveChallenge | null> {
  const challenges = await collectionListQuery({ types: ["challenge"] });
  const candidates = challenges.filter(
    (c) =>
      !c.is_archived &&
      !c.is_completed &&
      c.start_date &&
      new Date(c.start_date).getUTCFullYear() === currentYear,
  );
  const challenge = candidates[0];
  if (!challenge) return null;

  const goal = challenge.goal_count ?? 0;
  const current = challenge.read_count;
  const pace = derivePace(
    challenge.start_date,
    challenge.end_date,
    goal,
    current,
  );

  return {
    id: challenge.id,
    slug: challenge.slug,
    name: challenge.name,
    goal_count: goal,
    current_count: current,
    progress_percent: Math.round(challenge.progress_percent),
    pace_label: pace.label,
    pace_color: pace.color,
    pace_subtitle: paceSubtitle(challenge.end_date, goal, current),
  };
}

async function fetchMonthlyChart(
  supabase: SupabaseServer,
  userId: string,
  currentYear: number,
): Promise<
  {
    month: number;
    count: number;
    books: { id: string; slug: string; title: string; finish_date: string }[];
  }[]
> {
  const { data } = await supabase
    .from("reading")
    .select("finish_date, book:book_id(id, slug, title)")
    .eq("user_id", userId)
    .eq("status", "finished")
    .gte("finish_date", `${currentYear}-01-01`)
    .lte("finish_date", `${currentYear}-12-31`)
    .order("finish_date", { ascending: false });

  type Row = {
    finish_date: string | null;
    book: { id: string; slug: string; title: string } | null;
  };
  const buckets: {
    month: number;
    count: number;
    books: { id: string; slug: string; title: string; finish_date: string }[];
  }[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    count: 0,
    books: [],
  }));

  for (const r of (data as unknown as Row[]) ?? []) {
    if (!r.finish_date || !r.book) continue;
    const monthIdx = new Date(r.finish_date).getUTCMonth();
    buckets[monthIdx].count += 1;
    buckets[monthIdx].books.push({
      id: r.book.id,
      slug: r.book.slug,
      title: r.book.title,
      finish_date: r.finish_date,
    });
  }
  return buckets;
}

/**
 * Formata uma `Date` em `YYYY-MM-DD` usando os getters locais (não UTC).
 * Necessário porque `toISOString` converte pra UTC e dá off-by-one em fusos
 * negativos: `new Date(2026,0,1).toISOString()` → "2025-12-31" no Brasil.
 * Mesmo formato usado em `reading_progress_log.log_date` e `<input type="date">`.
 */
function formatLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function eachDayOfYearISO(year: number): string[] {
  const dates: string[] = [];
  const cursor = new Date(year, 0, 1);
  while (cursor.getFullYear() === year) {
    dates.push(formatLocalISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

async function fetchHeatmap(
  supabase: SupabaseServer,
  userId: string,
  currentYear: number,
): Promise<HomeHeatmap> {
  // Sessão 17.10: 2 queries em paralelo — pages_delta diário + finished_books
  // diário (livros finalizados naquele dia, por `reading.finish_date`).
  const [{ data: progress }, { data: finished }] = await Promise.all([
    supabase
      .from("reading_progress_log")
      .select("log_date, pages_delta")
      .eq("user_id", userId)
      .gte("log_date", `${currentYear}-01-01`)
      .lte("log_date", `${currentYear}-12-31`),
    supabase
      .from("reading")
      .select("finish_date")
      .eq("user_id", userId)
      .eq("status", "finished")
      .gte("finish_date", `${currentYear}-01-01`)
      .lte("finish_date", `${currentYear}-12-31`),
  ]);

  const aggregated = new Map<string, number>();
  for (const row of progress ?? []) {
    if (!row.log_date) continue;
    const current = aggregated.get(row.log_date) ?? 0;
    aggregated.set(row.log_date, current + (row.pages_delta ?? 0));
  }

  const finishedByDay = new Map<string, number>();
  for (const row of finished ?? []) {
    if (!row.finish_date) continue;
    finishedByDay.set(row.finish_date, (finishedByDay.get(row.finish_date) ?? 0) + 1);
  }

  const dates = eachDayOfYearISO(currentYear);
  const cells: HeatmapCell[] = dates.map((date) => ({
    date,
    pages_delta: aggregated.get(date) ?? 0,
    finished_books: finishedByDay.get(date) ?? 0,
  }));

  const totalPages = cells.reduce((acc, c) => acc + c.pages_delta, 0);
  const daysWithProgress = cells.filter((c) => c.pages_delta > 0).length;

  // Média sobre dias decorridos do ano (até hoje, inclusive). Em ano corrente
  // dilui pela parte já vivida; em ano passado, denominador é 365/366.
  const today = new Date();
  const currentYearTodayIsCurrent = today.getFullYear() === currentYear;
  const daysElapsed = currentYearTodayIsCurrent
    ? Math.floor(
        (today.getTime() - new Date(currentYear, 0, 1).getTime()) /
          86_400_000,
      ) + 1
    : cells.length;
  const safeDays = Math.max(1, daysElapsed);
  const averagePagesPerDay =
    Math.round((totalPages / safeDays) * 10) / 10;

  return {
    cells,
    total_pages: totalPages,
    total_days_with_progress: daysWithProgress,
    average_pages_per_day: averagePagesPerDay,
  };
}

/**
 * Distribuição por formato. Prioriza `reading.format` (formato em que o livro
 * foi efetivamente lido); se a reading não tem format, cai pra
 * `book.formats_owned[0]` (primeiro formato possuído). Nada disso existindo,
 * a leitura conta em "unknown" e a UI mostra "Outro".
 */
type FormatRaw = {
  format: string | null;
  book: { formats_owned: string[] | null } | null;
};

async function fetchFormatDistribution(
  supabase: SupabaseServer,
  userId: string,
  currentYear: number,
): Promise<FormatDistribution[]> {
  const { data } = await supabase
    .from("reading")
    .select(`format, book:book_id(formats_owned)`)
    .eq("user_id", userId)
    .eq("status", "finished")
    .gte("finish_date", `${currentYear}-01-01`)
    .lte("finish_date", `${currentYear}-12-31`);

  const rows = (data as unknown as FormatRaw[] | null) ?? [];
  const counts = new Map<string, number>();
  for (const r of rows) {
    const fmt = r.format ?? r.book?.formats_owned?.[0] ?? "unknown";
    counts.set(fmt, (counts.get(fmt) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Array.from(counts.entries())
    .map(([format, count]) => ({
      format,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Distribuição por categoria. Cada par reading×categoria conta como 1
 * "atribuição"; readings sem categoria contribuem 1 atribuição em "Sem gênero".
 * Retorna TODOS os gêneros (sem agrupar em "Outros") — a pizza na home
 * mostra a lista completa pra que gêneros minoritários (ex.: Romance fora do
 * top 4) fiquem visíveis. Percent é sobre o total de atribuições (soma 100%),
 * não sobre o número de readings.
 */
type GenreRaw = {
  book: {
    book_category:
      | { category: { name: string; slug: string } | null }[]
      | null;
  } | null;
};

async function fetchGenreDistribution(
  supabase: SupabaseServer,
  userId: string,
  currentYear: number,
): Promise<GenreDistribution[]> {
  const { data } = await supabase
    .from("reading")
    .select(
      `book:book_id(book_category(category(name, slug)))`,
    )
    .eq("user_id", userId)
    .eq("status", "finished")
    .gte("finish_date", `${currentYear}-01-01`)
    .lte("finish_date", `${currentYear}-12-31`);

  const rows = (data as unknown as GenreRaw[] | null) ?? [];
  // Conta atribuições por categoria (chaveado por nome) e guarda o slug
  // pareado pra cada nome — necessário pra montar o link na home.
  const counts = new Map<string, number>();
  const slugs = new Map<string, string>();
  for (const r of rows) {
    const cats =
      r.book?.book_category
        ?.map((bc) => bc.category)
        .filter((c): c is { name: string; slug: string } => !!c) ?? [];
    if (cats.length === 0) {
      counts.set("Sem gênero", (counts.get("Sem gênero") ?? 0) + 1);
      continue;
    }
    for (const cat of cats) {
      counts.set(cat.name, (counts.get(cat.name) ?? 0) + 1);
      slugs.set(cat.name, cat.slug);
    }
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const sorted = Array.from(counts.entries())
    .map(([genre, count]) => ({ genre, count, slug: slugs.get(genre) ?? null }))
    .sort((a, b) => b.count - a.count);

  return sorted.map((r) => ({
    ...r,
    percent: Math.round((r.count / total) * 100),
  }));
}

/**
 * Sparkline dos últimos 30 dias. Cada entry é `pages_delta` agregado por dia
 * (índice 0 = 29 dias atrás, índice 29 = hoje). Average é página/dia média
 * da janela. Trend compara primeira metade com segunda; >15% pra cima ou
 * baixo ativa "up"/"down", o resto é "stable" (incluindo o caso onde a
 * primeira metade é zero — sem base, não dá pra falar em tendência).
 */
async function fetchPaceSparkline(
  supabase: SupabaseServer,
  userId: string,
): Promise<PaceSparkline> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 29);

  const startISO = formatLocalISO(start);
  const endISO = formatLocalISO(today);

  const { data } = await supabase
    .from("reading_progress_log")
    .select("log_date, pages_delta")
    .eq("user_id", userId)
    .gte("log_date", startISO)
    .lte("log_date", endISO);

  const aggregated = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.log_date) continue;
    aggregated.set(
      row.log_date,
      (aggregated.get(row.log_date) ?? 0) + (row.pages_delta ?? 0),
    );
  }

  const values: number[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    values.push(aggregated.get(formatLocalISO(d)) ?? 0);
  }

  const total = values.reduce((a, b) => a + b, 0);
  const average_per_day = Math.round((total / values.length) * 10) / 10;

  const firstHalf = values.slice(0, 15).reduce((a, b) => a + b, 0);
  const secondHalf = values.slice(15).reduce((a, b) => a + b, 0);
  const diff = secondHalf - firstHalf;
  let trend: PaceTrend = "stable";
  if (firstHalf > 0) {
    if (diff > firstHalf * 0.15) trend = "up";
    else if (diff < -firstHalf * 0.15) trend = "down";
  } else if (secondHalf > 0) {
    // Saiu de zero pra alguma coisa — conta como subida.
    trend = "up";
  }

  return { values, average_per_day, trend };
}

/**
 * Top 5 autores pelos `finished` do ano. Cada reading contribui 1 pra cada
 * autor do livro (multi-author conta para todos). Empate desfeito por nome
 * pra ordem estável.
 */
type TopAuthorRaw = {
  book: {
    book_author:
      | { author: { id: string; slug: string; name: string } | null }[]
      | null;
  } | null;
};

async function fetchTopAuthors(
  supabase: SupabaseServer,
  userId: string,
  currentYear: number,
): Promise<TopAuthor[]> {
  const { data } = await supabase
    .from("reading")
    .select(`book:book_id(book_author(author(id, slug, name)))`)
    .eq("user_id", userId)
    .eq("status", "finished")
    .gte("finish_date", `${currentYear}-01-01`)
    .lte("finish_date", `${currentYear}-12-31`);

  const rows = (data as unknown as TopAuthorRaw[] | null) ?? [];
  const counts = new Map<
    string,
    { id: string; slug: string; name: string; count: number }
  >();
  for (const r of rows) {
    for (const ba of r.book?.book_author ?? []) {
      const a = ba.author;
      if (!a) continue;
      const existing = counts.get(a.id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(a.id, { id: a.id, slug: a.slug, name: a.name, count: 1 });
      }
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.name.localeCompare(b.name, "pt-BR");
    })
    .slice(0, 5)
    .map(({ id, slug, name, count }) => ({
      id,
      slug,
      name,
      book_count: count,
    }));
}

/**
 * Distribuição de notas dos `finished` do ano. Sempre retorna 5 entradas
 * (5★ → 1★) mesmo com count zero. Ratings fracionários (4.5 etc) são
 * arredondados pro inteiro mais próximo. Ratings null ou 0 são ignorados
 * (livro sem nota).
 */
async function fetchRatingDistribution(
  supabase: SupabaseServer,
  userId: string,
  currentYear: number,
): Promise<RatingBucket[]> {
  const { data } = await supabase
    .from("reading")
    .select("rating")
    .eq("user_id", userId)
    .eq("status", "finished")
    .gte("finish_date", `${currentYear}-01-01`)
    .lte("finish_date", `${currentYear}-12-31`)
    .not("rating", "is", null)
    .gt("rating", 0);

  const counts = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);
  for (const row of data ?? []) {
    if (row.rating === null) continue;
    const rounded = Math.max(1, Math.min(5, Math.round(row.rating)));
    counts.set(rounded, (counts.get(rounded) ?? 0) + 1);
  }

  return ([5, 4, 3, 2, 1] as const).map((rating) => ({
    rating,
    count: counts.get(rating) ?? 0,
  }));
}

type ReadingStatus = Database["public"]["Enums"]["reading_status"];

/**
 * "TBR" do ponto de vista da home: o livro nunca teve uma reading que saiu de
 * `tbr` (não está/foi `reading`/`paused`/`finished`/`abandoned`). Como o
 * próprio enum não inclui `tbr` — sem reading = TBR — a checagem é
 * "não há reading com nenhum desses 4 status".
 */
function isTbrFromReadings(
  readings: { status: ReadingStatus }[] | null | undefined,
): boolean {
  if (!readings || readings.length === 0) return true;
  const ACTIVE: ReadingStatus[] = [
    "reading",
    "paused",
    "finished",
    "abandoned",
  ];
  return !readings.some((r) => ACTIVE.includes(r.status));
}

type NextReadBookRaw = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  serie_id: string | null;
  volume: number | null;
  book_author: { author: { name: string } | null }[] | null;
  reading: { status: ReadingStatus }[] | null;
};

function bookToNextReadItem(
  book: NextReadBookRaw,
  origin: NextReadOrigin,
  origin_label: string,
): NextReadItem {
  const author =
    book.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null;
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    author_name: author,
    cover_url: book.cover ? imagesUrl(book.cover) : null,
    origin,
    origin_label,
  };
}

/**
 * Sugestões compostas:
 *   1. Books com `priority='high'` ainda TBR (até 5)
 *   2. Books com `priority='medium'` ainda TBR (preenche até 5)
 *   3. Próximo volume TBR de séries em curso (preenche até 5)
 * Sem dedup hardcoded — o mesmo livro pode satisfazer (1) e (3) mas o set
 * `usedIds` impede duplicar.
 */
async function fetchNextReads(
  supabase: SupabaseServer,
  userId: string,
): Promise<NextReadItem[]> {
  const result: NextReadItem[] = [];
  const usedIds = new Set<string>();
  const TARGET = 5;

  const fetchByPriority = async (
    priority: "high" | "medium",
    limit: number,
  ): Promise<NextReadBookRaw[]> => {
    const { data } = await supabase
      .from("book")
      .select(
        `id, slug, title, cover, serie_id, volume,
         book_author(author(name)),
         reading(status)`,
      )
      .eq("user_id", userId)
      .eq("priority", priority)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return (data as unknown as NextReadBookRaw[] | null) ?? [];
  };

  // Buffer × 2 porque uma fração dos prioritários pode já estar lida.
  const high = await fetchByPriority("high", TARGET * 2);
  for (const book of high) {
    if (result.length >= TARGET) break;
    if (usedIds.has(book.id)) continue;
    if (!isTbrFromReadings(book.reading)) continue;
    result.push(
      bookToNextReadItem(book, "priority_high", "TBR · prioridade alta"),
    );
    usedIds.add(book.id);
  }

  if (result.length < TARGET) {
    const medium = await fetchByPriority("medium", (TARGET - result.length) * 2);
    for (const book of medium) {
      if (result.length >= TARGET) break;
      if (usedIds.has(book.id)) continue;
      if (!isTbrFromReadings(book.reading)) continue;
      result.push(
        bookToNextReadItem(book, "priority_medium", "TBR · prioridade média"),
      );
      usedIds.add(book.id);
    }
  }

  if (result.length < TARGET) {
    const remaining = TARGET - result.length;
    const seriesNext = await findNextVolumesInProgressSeries(
      supabase,
      userId,
      remaining,
    );
    for (const item of seriesNext) {
      if (result.length >= TARGET) break;
      if (usedIds.has(item.id)) continue;
      result.push(item);
      usedIds.add(item.id);
    }
  }

  return result;
}

type SerieRaw = {
  id: string;
  name: string;
  book: NextReadBookRaw[] | null;
};

async function findNextVolumesInProgressSeries(
  supabase: SupabaseServer,
  userId: string,
  limit: number,
): Promise<NextReadItem[]> {
  const { data } = await supabase
    .from("serie")
    .select(
      `id, name,
       book(id, slug, title, cover, serie_id, volume,
         book_author(author(name)),
         reading(status))`,
    )
    .eq("user_id", userId);

  const series = (data as unknown as SerieRaw[] | null) ?? [];
  const result: NextReadItem[] = [];

  for (const serie of series) {
    if (result.length >= limit) break;
    const books = serie.book ?? [];
    if (books.length === 0) continue;

    // Em curso = ao menos 1 livro `finished`.
    const hasFinished = books.some((b) =>
      b.reading?.some((r) => r.status === "finished"),
    );
    if (!hasFinished) continue;

    // Volume sem ordem cai no fim da lista. Empate vira tie-break por título.
    const sorted = books.slice().sort((a, b) => {
      const av = a.volume ?? Number.POSITIVE_INFINITY;
      const bv = b.volume ?? Number.POSITIVE_INFINITY;
      if (av !== bv) return av - bv;
      return a.title.localeCompare(b.title, "pt-BR");
    });

    const next = sorted.find((b) => isTbrFromReadings(b.reading));
    if (!next) continue;

    const volumeLabel = next.volume ? ` vol. ${next.volume}` : "";
    result.push(
      bookToNextReadItem(
        next,
        "series_next",
        `Próximo · ${serie.name}${volumeLabel}`,
      ),
    );
  }

  return result;
}

/**
 * Top 3 coleções marcadas como favoritas (não-arquivadas). Reusa
 * `collectionListQuery` que já calcula `progress_percent` e `is_completed`
 * por tipo — evita reescrever a lógica de challenge×goal/finished, wishlist
 * adquirida etc.
 */
async function fetchFavoriteCollections(): Promise<FavoriteCollection[]> {
  const collections = await collectionListQuery();
  const favorites = collections
    .filter((c) => c.is_favorite && !c.is_archived)
    .slice(0, 3);

  return favorites.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    type: c.type,
    progress_percent: Math.round(c.progress_percent),
    subtitle: buildCollectionSubtitle(c),
    is_completed: c.is_completed,
  }));
}

function buildCollectionSubtitle(c: {
  type: CollectionType;
  goal_count: number | null;
  book_count: number;
  read_count: number;
  wishlist_count: number;
  progress_percent: number;
}): string {
  const pct = Math.round(c.progress_percent);
  if (c.type === "challenge") {
    const goal = c.goal_count ?? 0;
    return goal > 0
      ? `${c.read_count}/${goal} livros · ${pct}%`
      : `${c.read_count} livros lidos`;
  }
  if (c.type === "subscription") {
    const total = c.book_count + c.wishlist_count;
    return `${total} ${total === 1 ? "item" : "itens"} · ${c.read_count} lido${c.read_count === 1 ? "" : "s"}`;
  }
  if (c.type === "wishlist") {
    const total = c.book_count + c.wishlist_count;
    return `${c.book_count}/${total} adquirido${total === 1 ? "" : "s"}`;
  }
  // shelf | list
  const total = c.book_count + c.wishlist_count;
  return `${total} ${total === 1 ? "livro" : "livros"} · ${pct}% lidos`;
}

/**
 * Pega até 50 quotes do user e embaralha client-side; corta em 10. Embaralho
 * em memória evita `order by random()` (caro em datasets grandes; trivial em
 * biblioteca pessoal mas o pattern fica saudável). Quote pode estar
 * desvinculada de book (`book_id` null) — nesse caso `book_title` fica null
 * e a UI mostra só o autor. Dedup não é feito: o mesmo livro pode contribuir
 * com várias citações no rotativo.
 */
type QuoteRaw = {
  id: string;
  slug: string;
  text: string;
  author_name: string | null;
  book: { title: string; slug: string } | null;
};

async function fetchRandomQuotes(
  supabase: SupabaseServer,
  userId: string,
): Promise<QuoteForCarousel[]> {
  const { data } = await supabase
    .from("quote")
    .select(`id, slug, text, author_name, book:book_id(title, slug)`)
    .eq("user_id", userId)
    .limit(50);

  const rows = (data as unknown as QuoteRaw[] | null) ?? [];
  if (rows.length === 0) return [];

  // Fisher-Yates in-place. Cópia rasa pra não mutar o retorno do Supabase.
  const shuffled = rows.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 10).map((q) => ({
    id: q.id,
    slug: q.slug,
    text: q.text,
    author_name: q.author_name,
    book_title: q.book?.title ?? null,
    book_slug: q.book?.slug ?? null,
  }));
}

type RecentFinishedRaw = {
  finish_date: string | null;
  book: {
    id: string;
    slug: string;
    title: string;
    cover: string | null;
    book_author: { author: { name: string } | null }[] | null;
  } | null;
};

/**
 * Re-leituras: o mesmo livro pode ter múltiplas readings finished. Como a key
 * usada no render é `book.id`, sem dedup aqui o React solta warning de chave
 * duplicada (e a UI repete capas). Buffer de 20 absorve duplicatas; mantemos
 * só a primeira ocorrência de cada book.id (mais recente, já vem desc).
 */
async function fetchRecentlyFinished(
  supabase: SupabaseServer,
  userId: string,
): Promise<RecentlyFinishedBook[]> {
  const { data } = await supabase
    .from("reading")
    .select(
      `finish_date,
       book:book_id(id, slug, title, cover, book_author(author(name)))`,
    )
    .eq("user_id", userId)
    .eq("status", "finished")
    .not("finish_date", "is", null)
    .order("finish_date", { ascending: false })
    .limit(20);

  const rows = (data as unknown as RecentFinishedRaw[] | null) ?? [];
  const seen = new Set<string>();
  const result: RecentlyFinishedBook[] = [];

  for (const r of rows) {
    if (!r.book || !r.finish_date) continue;
    if (seen.has(r.book.id)) continue;
    seen.add(r.book.id);
    result.push({
      id: r.book.id,
      slug: r.book.slug,
      title: r.book.title,
      author_name:
        r.book.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null,
      cover_url: r.book.cover ? imagesUrl(r.book.cover) : null,
      finish_date: r.finish_date,
    });
    if (result.length >= 6) break;
  }

  return result;
}

export async function getHomeData(): Promise<HomeData> {
  const start = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date();
  const currentYear = today.getFullYear();
  const todayISO = today.toISOString().slice(0, 10);
  const monthsElapsed = today.getMonth() + 1;

  const [
    readingNow,
    lastActivity,
    stats,
    activeChallenge,
    monthlyChart,
    heatmap,
    formatDistribution,
    genreDistribution,
    paceSparkline,
    topAuthors,
    ratingDistribution,
    nextReads,
    favoriteCollections,
    randomQuotes,
    recentlyFinished,
  ] = await Promise.all([
    fetchReadingNow(supabase, user.id),
    fetchLastActivity(supabase, user.id),
    fetchYearStats(supabase, user.id, currentYear, monthsElapsed),
    fetchActiveChallenge(currentYear),
    fetchMonthlyChart(supabase, user.id, currentYear),
    fetchHeatmap(supabase, user.id, currentYear),
    fetchFormatDistribution(supabase, user.id, currentYear),
    fetchGenreDistribution(supabase, user.id, currentYear),
    fetchPaceSparkline(supabase, user.id),
    fetchTopAuthors(supabase, user.id, currentYear),
    fetchRatingDistribution(supabase, user.id, currentYear),
    fetchNextReads(supabase, user.id),
    fetchFavoriteCollections(),
    fetchRandomQuotes(supabase, user.id),
    fetchRecentlyFinished(supabase, user.id),
  ]);

  // display_name vem da tabela `profiles` (sessão 17.1). Fallback em cascata:
  //   profiles.display_name → user_metadata.full_name → email-prefix → null.
  // Mostramos só o primeiro nome na saudação ("Boa noite, Juliana") — se o
  // user salvou o nome completo, pegamos a primeira palavra.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const rawName =
    profile?.display_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    null;
  const fullName = rawName ? rawName.split(/\s+/)[0] : null;

  console.log(`[homeData] took ${Date.now() - start}ms`);

  return {
    user_name: fullName,
    current_year: currentYear,
    today: todayISO,
    reading_now: readingNow,
    last_activity: lastActivity,
    stats,
    active_challenge: activeChallenge,
    books_per_month_chart: monthlyChart,
    heatmap,
    format_distribution: formatDistribution,
    genre_distribution: genreDistribution,
    pace_sparkline: paceSparkline,
    top_authors: topAuthors,
    rating_distribution: ratingDistribution,
    next_reads: nextReads,
    favorite_collections: favoriteCollections,
    random_quotes: randomQuotes,
    recently_finished: recentlyFinished,
  };
}
