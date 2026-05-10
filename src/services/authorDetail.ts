import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";
import type { Database } from "@/utils/typings/supabase";

type AuthorRow = Database["public"]["Tables"]["author"]["Row"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];

export type AuthorDetailBook = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  publication_year: number | null;
  pages: number | null;
  serie_id: string | null;
  has_finished_reading: boolean;
  ratings: number[]; // ratings de readings finished com rating > 0
};

export type AuthorDetailSerie = {
  id: string;
  slug: string;
  name: string;
  qty_volumes: number | null;
};

export type AuthorDetailQuote = {
  id: string;
  slug: string;
  text: string;
  created_at: string;
  book: { id: string; slug: string; title: string } | null;
};

export type AuthorDetailData = {
  author: AuthorRow;
  books: AuthorDetailBook[];
  series: AuthorDetailSerie[];
  quotes: AuthorDetailQuote[];
  bibliography: BibliographyEntry[];
  readingHistory: ReadingHistoryEntry[];
  stats: {
    books_count: number;
    read_count: number;
    quotes_count: number;
    pages_read: number;
    avg_rating: number | null;
  };
};

/** Entry combinada: linha da author_bibliography ∪ book do autor.
 *  Deduplicado por title_normalized; quando há overlap, prefere o book
 *  (com is_owned=true e dados de leitura). */
export type BibliographyEntry = {
  id: string;
  title: string;
  publication_year: number | null;
  is_owned: boolean;
  book_id: string | null;
  book_slug: string | null;
  derived_status: ReadingStatus | "tbr" | null;
  rating: number | null;
  current_page: number | null;
  pages_count: number | null;
  acquired_at: string | null;
  finished_at: string | null;
  started_at: string | null;
  in_collections: string[];
};

export type ReadingHistoryEntry = {
  book_id: string;
  book_slug: string;
  title: string;
  status: ReadingStatus;
  started_at: string | null;
  finished_at: string | null;
  duration_days: number | null;
  rating: number | null;
  current_page: number | null;
  pages_count: number | null;
  sort_key: string;
};

type RawBook = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  publication_year: number | null;
  pages: number | null;
  serie_id: string | null;
  reading?: { status: string; rating: number | null }[] | null;
};

export async function authorDetailBySlug(
  slug: string,
): Promise<AuthorDetailData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: author } = await supabase
    .from("author")
    .select("*")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .maybeSingle();
  if (!author) return null;

  // Livros do autor + readings pra derivar status e ratings
  const { data: bookLinks } = await supabase
    .from("book_author")
    .select(
      `book(id, slug, title, cover, publication_year, pages, serie_id, reading(status, rating))`,
    )
    .eq("user_id", user.id)
    .eq("author_id", author.id);

  const booksRaw =
    ((bookLinks ?? [])
      .map((l) => (l as unknown as { book: RawBook | null }).book)
      .filter((b): b is RawBook => !!b)) ?? [];

  const books: AuthorDetailBook[] = booksRaw.map((b) => {
    const finishedWithRating: number[] = [];
    let hasFinished = false;
    for (const r of b.reading ?? []) {
      if (r.status === "finished") {
        hasFinished = true;
        if (r.rating !== null && r.rating > 0) finishedWithRating.push(r.rating);
      }
    }
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      cover: b.cover,
      publication_year: b.publication_year,
      pages: b.pages,
      serie_id: b.serie_id,
      has_finished_reading: hasFinished,
      ratings: finishedWithRating,
    };
  });
  // Sort cronológico (publication_year asc, depois title)
  books.sort((a, b) => {
    const ay = a.publication_year ?? 9999;
    const by = b.publication_year ?? 9999;
    if (ay !== by) return ay - by;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  // Séries que contêm pelo menos um livro do autor
  const serieIds = [
    ...new Set(books.map((b) => b.serie_id).filter((id): id is string => !!id)),
  ];
  let series: AuthorDetailSerie[] = [];
  if (serieIds.length > 0) {
    const { data: rawSeries } = await supabase
      .from("serie")
      .select("id, slug, name, qty_volumes")
      .in("id", serieIds);
    series = (rawSeries ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  // Citações: vinculadas via book_id OU com author_name = name. Dedup por id.
  const bookIds = books.map((b) => b.id);
  const [{ data: directQuotes }, linkedRes] = await Promise.all([
    supabase
      .from("quote")
      .select(`id, slug, text, created_at, book(id, slug, title)`)
      .eq("user_id", user.id)
      .eq("author_name", author.name)
      .order("created_at", { ascending: false })
      .limit(60),
    bookIds.length > 0
      ? supabase
          .from("quote")
          .select(`id, slug, text, created_at, book(id, slug, title)`)
          .eq("user_id", user.id)
          .in("book_id", bookIds)
          .is("author_name", null)
          .order("created_at", { ascending: false })
          .limit(60)
      : Promise.resolve({ data: [] as unknown[] | null }),
  ]);
  const quotesById = new Map<string, AuthorDetailQuote>();
  for (const q of (directQuotes ?? []) as unknown as AuthorDetailQuote[]) {
    quotesById.set(q.id, q);
  }
  for (const q of (linkedRes.data ?? []) as unknown as AuthorDetailQuote[]) {
    if (!quotesById.has(q.id)) quotesById.set(q.id, q);
  }
  const quotes = [...quotesById.values()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  // Stats
  const allRatings = books.flatMap((b) => b.ratings);
  const avg_rating =
    allRatings.length > 0
      ? allRatings.reduce((s, r) => s + r, 0) / allRatings.length
      : null;
  const pages_read = books
    .filter((b) => b.has_finished_reading)
    .reduce((s, b) => s + (b.pages ?? 0), 0);
  const read_count = books.filter((b) => b.has_finished_reading).length;

  // ----- Bibliografia (UNION author_bibliography ∪ book) -----
  const [bibRes, bookExtras, collectionLinks] = await Promise.all([
    supabase
      .from("author_bibliography")
      .select("id, title, publication_year")
      .eq("author_id", author.id),
    bookIds.length > 0
      ? supabase
          .from("book")
          .select(
            `id, slug, title, created_at, pages,
             reading(status, start_date, finish_date, current_page, rating, updated_at)`,
          )
          .in("id", bookIds)
      : Promise.resolve({ data: [] as unknown[] }),
    bookIds.length > 0
      ? supabase
          .from("collection_item")
          .select("book_id, collection:collection_id(name, is_archived)")
          .in("book_id", bookIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  type BookExtra = {
    id: string;
    slug: string;
    title: string;
    created_at: string;
    pages: number | null;
    reading: {
      status: ReadingStatus;
      start_date: string | null;
      finish_date: string | null;
      current_page: number | null;
      rating: number | null;
      updated_at: string;
    }[] | null;
  };
  const bookExtrasById = new Map<string, BookExtra>();
  for (const b of (bookExtras.data ?? []) as unknown as BookExtra[]) {
    bookExtrasById.set(b.id, b);
  }

  const collectionsByBook = new Map<string, string[]>();
  type RawCollLink = {
    book_id: string | null;
    collection: { name: string; is_archived: boolean } | null;
  };
  for (const r of (collectionLinks.data ?? []) as unknown as RawCollLink[]) {
    if (!r.book_id || !r.collection) continue;
    if (r.collection.is_archived) continue;
    const arr = collectionsByBook.get(r.book_id) ?? [];
    if (arr.length < 2) arr.push(r.collection.name);
    collectionsByBook.set(r.book_id, arr);
  }

  const normalize = (s: string) => normalizeSearchQuery(s);
  const bibliographyEntries: BibliographyEntry[] = [];
  const seenTitles = new Set<string>();

  // 1. Books primeiro: têm dados de leitura, prevalecem sobre bibliografia
  //    manual em caso de overlap por título normalizado.
  for (const b of bookExtrasById.values()) {
    const titleKey = normalize(b.title);
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);
    const sortedR = (b.reading ?? []).slice().sort((a, c) => {
      const af = a.finish_date ?? "";
      const cf = c.finish_date ?? "";
      if (af !== cf) return cf.localeCompare(af);
      return (c.start_date ?? "").localeCompare(a.start_date ?? "");
    });
    const last = sortedR[0];
    const status: ReadingStatus | "tbr" = last
      ? (last.status as ReadingStatus)
      : "tbr";
    const bibForYear = (bibRes.data ?? []).find(
      (bib) => normalize(bib.title) === titleKey,
    );
    const bookEntry = books.find((x) => x.id === b.id);
    const publicationYear =
      bookEntry?.publication_year ?? bibForYear?.publication_year ?? null;
    bibliographyEntries.push({
      id: b.id,
      title: b.title,
      publication_year: publicationYear,
      is_owned: true,
      book_id: b.id,
      book_slug: b.slug,
      derived_status: status,
      rating: last?.rating ?? null,
      current_page: last?.current_page ?? null,
      pages_count: b.pages,
      acquired_at: b.created_at,
      finished_at:
        last?.status === "finished" || last?.status === "abandoned"
          ? last.finish_date
          : null,
      started_at: last?.start_date ?? null,
      in_collections: collectionsByBook.get(b.id) ?? [],
    });
  }
  // 2. Bibliografia restante (entries que ainda não estão cobertas por book)
  for (const bib of bibRes.data ?? []) {
    const titleKey = normalize(bib.title);
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);
    bibliographyEntries.push({
      id: bib.id,
      title: bib.title,
      publication_year: bib.publication_year,
      is_owned: false,
      book_id: null,
      book_slug: null,
      derived_status: null,
      rating: null,
      current_page: null,
      pages_count: null,
      acquired_at: null,
      finished_at: null,
      started_at: null,
      in_collections: [],
    });
  }
  bibliographyEntries.sort((a, b) => {
    const ay = a.publication_year ?? 99999;
    const by = b.publication_year ?? 99999;
    if (ay !== by) return ay - by;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  // ----- Histórico de leitura (todas as readings) -----
  const readingHistory: ReadingHistoryEntry[] = [];
  for (const b of bookExtrasById.values()) {
    for (const r of b.reading ?? []) {
      const startedTs = r.start_date ? new Date(r.start_date).getTime() : null;
      const finishedTs = r.finish_date
        ? new Date(r.finish_date).getTime()
        : null;
      const duration_days =
        startedTs && finishedTs
          ? Math.max(0, Math.floor((finishedTs - startedTs) / 86400000))
          : null;
      const sort_key =
        r.status === "reading" || r.status === "paused"
          ? r.updated_at
          : r.finish_date ?? r.updated_at;
      readingHistory.push({
        book_id: b.id,
        book_slug: b.slug,
        title: b.title,
        status: r.status,
        started_at: r.start_date,
        finished_at: r.finish_date,
        duration_days,
        rating: r.rating,
        current_page: r.current_page,
        pages_count: b.pages,
        sort_key,
      });
    }
  }
  // Em curso primeiro (reading, paused); depois finished/abandoned por sort_key desc
  readingHistory.sort((a, b) => {
    const aActive = a.status === "reading" || a.status === "paused";
    const bActive = b.status === "reading" || b.status === "paused";
    if (aActive !== bActive) return aActive ? -1 : 1;
    return (b.sort_key ?? "").localeCompare(a.sort_key ?? "");
  });

  return {
    author,
    books,
    series,
    quotes,
    bibliography: bibliographyEntries,
    readingHistory,
    stats: {
      books_count: books.length,
      read_count,
      quotes_count: quotes.length,
      pages_read,
      avg_rating,
    },
  };
}
