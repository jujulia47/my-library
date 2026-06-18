import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type TodayActiveReading = {
  reading_id: string;
  book_id: string;
  book_slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  current_page: number;
  pages_total: number | null;
};

export type TodayPagesLogged = {
  kind: "pages";
  reading_id: string;
  book_slug: string;
  book_title: string;
  pages_delta: number;
  notes: string | null;
};

export type TodayQuoteAdded = {
  kind: "quote";
  quote_id: string;
  quote_slug: string;
  text: string;
  book_slug: string | null;
  book_title: string | null;
  author_name: string | null;
};

export type TodayBookFinished = {
  kind: "finished";
  reading_id: string;
  book_slug: string;
  book_title: string;
  rating: number | null;
};

export type TodayBookAcquired = {
  kind: "acquired";
  book_id: string;
  book_slug: string;
  book_title: string;
  purchase_price: number | null;
};

export type TodayActivityItem =
  | TodayPagesLogged
  | TodayQuoteAdded
  | TodayBookFinished
  | TodayBookAcquired;

export type TodayData = {
  /** Data de hoje em ISO YYYY-MM-DD (UTC). */
  date: string;
  active_readings: TodayActiveReading[];
  activities: TodayActivityItem[];
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Carrega tudo do dia pra alimentar a página `/today` — "diário do dia".
 *  - Leituras ativas (status=reading) pra alimentar o input rápido
 *  - Atividades de hoje: páginas registradas, anotações, citações criadas,
 *    livros concluídos, livros adquiridos
 */
export async function getTodayData(userId: string): Promise<TodayData> {
  const supabase = await createClient();
  const date = todayISO();
  const dayStart = `${date}T00:00:00Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const [
    activeRes,
    progressLogRes,
    quotesRes,
    finishedRes,
    acquiredRes,
  ] = await Promise.all([
    fetchActiveReadings(supabase, userId),
    fetchTodayProgressLog(supabase, userId, date),
    fetchTodayQuotes(supabase, userId, dayStart, dayEnd),
    fetchTodayFinishedReadings(supabase, userId, date),
    fetchTodayAcquisitions(supabase, userId, date),
  ]);

  const activities: TodayActivityItem[] = [
    ...progressLogRes,
    ...quotesRes,
    ...finishedRes,
    ...acquiredRes,
  ];

  return {
    date,
    active_readings: activeRes,
    activities,
  };
}

async function fetchActiveReadings(
  supabase: SupabaseServer,
  userId: string,
): Promise<TodayActiveReading[]> {
  const { data } = await supabase
    .from("reading")
    .select(
      `id, current_page,
       book:book_id(id, slug, title, pages, cover,
         book_author(author(name)))`,
    )
    .eq("user_id", userId)
    .eq("status", "reading")
    .order("updated_at", { ascending: false });

  type Raw = {
    id: string;
    current_page: number | null;
    book: {
      id: string;
      slug: string;
      title: string;
      pages: number | null;
      cover: string | null;
      book_author: { author: { name: string } | null }[] | null;
    } | null;
  };

  const rows = (data as unknown as Raw[] | null) ?? [];
  return rows
    .filter((r) => r.book)
    .map((r) => ({
      reading_id: r.id,
      book_id: r.book!.id,
      book_slug: r.book!.slug,
      title: r.book!.title,
      author_name:
        r.book!.book_author?.find((ba) => ba.author?.name)?.author?.name ??
        null,
      cover_url: r.book!.cover ? imagesUrl(r.book!.cover) : null,
      current_page: r.current_page ?? 0,
      pages_total: r.book!.pages,
    }));
}

async function fetchTodayProgressLog(
  supabase: SupabaseServer,
  userId: string,
  date: string,
): Promise<TodayPagesLogged[]> {
  const { data } = await supabase
    .from("reading_progress_log")
    .select(
      `pages_delta, notes,
       reading:reading_id(id, book:book_id(slug, title))`,
    )
    .eq("user_id", userId)
    .eq("log_date", date);

  type Raw = {
    pages_delta: number;
    notes: string | null;
    reading: {
      id: string;
      book: { slug: string; title: string } | null;
    } | null;
  };

  const rows = (data as unknown as Raw[] | null) ?? [];
  return rows
    .filter((r) => r.reading?.book)
    .map((r) => ({
      kind: "pages" as const,
      reading_id: r.reading!.id,
      book_slug: r.reading!.book!.slug,
      book_title: r.reading!.book!.title,
      pages_delta: r.pages_delta,
      notes: r.notes,
    }));
}

async function fetchTodayQuotes(
  supabase: SupabaseServer,
  userId: string,
  dayStart: string,
  dayEnd: string,
): Promise<TodayQuoteAdded[]> {
  const { data } = await supabase
    .from("quote")
    .select(
      `id, slug, text, author_name,
       book:book_id(slug, title)`,
    )
    .eq("user_id", userId)
    .gte("created_at", dayStart)
    .lte("created_at", dayEnd)
    .order("created_at", { ascending: false });

  type Raw = {
    id: string;
    slug: string;
    text: string;
    author_name: string | null;
    book: { slug: string; title: string } | null;
  };

  const rows = (data as unknown as Raw[] | null) ?? [];
  return rows.map((r) => ({
    kind: "quote" as const,
    quote_id: r.id,
    quote_slug: r.slug,
    text: r.text,
    book_slug: r.book?.slug ?? null,
    book_title: r.book?.title ?? null,
    author_name: r.author_name,
  }));
}

async function fetchTodayFinishedReadings(
  supabase: SupabaseServer,
  userId: string,
  date: string,
): Promise<TodayBookFinished[]> {
  const { data } = await supabase
    .from("reading")
    .select(`id, rating, book:book_id(slug, title)`)
    .eq("user_id", userId)
    .eq("status", "finished")
    .eq("finish_date", date);

  type Raw = {
    id: string;
    rating: number | null;
    book: { slug: string; title: string } | null;
  };

  const rows = (data as unknown as Raw[] | null) ?? [];
  return rows
    .filter((r) => r.book)
    .map((r) => ({
      kind: "finished" as const,
      reading_id: r.id,
      book_slug: r.book!.slug,
      book_title: r.book!.title,
      rating: r.rating,
    }));
}

async function fetchTodayAcquisitions(
  supabase: SupabaseServer,
  userId: string,
  date: string,
): Promise<TodayBookAcquired[]> {
  const { data } = await supabase
    .from("book")
    .select("id, slug, title, purchase_price")
    .eq("user_id", userId)
    .eq("acquired_at", date);

  type Raw = {
    id: string;
    slug: string;
    title: string;
    purchase_price: number | string | null;
  };

  const rows = (data as unknown as Raw[] | null) ?? [];
  return rows.map((r) => ({
    kind: "acquired" as const,
    book_id: r.id,
    book_slug: r.slug,
    book_title: r.title,
    purchase_price:
      r.purchase_price === null
        ? null
        : typeof r.purchase_price === "string"
          ? Number(r.purchase_price)
          : r.purchase_price,
  }));
}
