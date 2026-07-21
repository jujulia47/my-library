import { createClient } from "@/utils/supabase/server";
import { countPhysicalCopies } from "@/services/bookList";
import type { Database } from "@/utils/typings/supabase";
import type { BookLanguage } from "@/utils/languageLabels";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
type Country = Database["public"]["Enums"]["country"];

// =============================================================================
// Tipos públicos
// =============================================================================

export type CountryBookCount = {
  country: Country;
  /** Livros lidos (distintos) com pelo menos um autor desse país. */
  count: number;
  /** % sobre o total de livros lidos no escopo. */
  percent: number;
};

export type LanguageCount = {
  /** null = livro sem idioma cadastrado. */
  language: BookLanguage | null;
  count: number;
  percent: number;
};

export type PageBucket = {
  /** Ex.: "≤100", "101–200", "1000+". */
  label: string;
  count: number;
};

/**
 * Recorte de leitura (livros com reading finished): países dos autores,
 * idiomas e faixa de páginas. `year` limita ao finish_date do ano; sem ele é
 * a vida toda.
 */
export type ReadingOverview = {
  read_books_total: number;
  /** Lidos sem país de autor cadastrado (fora do mapa). */
  without_country: number;
  countries: CountryBookCount[];
  languages: LanguageCount[];
  page_buckets: PageBucket[];
  // --- Perfil de leitura (usado na visão geral) ---
  /** Autores distintos entre os livros lidos. */
  authors_read_total: number;
  /** Autor com mais livros lidos. */
  top_author: { name: string; count: number } | null;
  /** Livros com 2+ leituras finalizadas (relidos). */
  reread_books: number;
  /** Média das notas das leituras finalizadas (null sem notas). */
  avg_rating: number | null;
  /** Leituras finalizadas com nota / com nota 5. */
  rated_count: number;
  five_star_count: number;
  /** Ano com mais livros terminados (vida toda). */
  record_books_year: { year: number; books: number } | null;
  /** Ano com mais páginas lidas (soma das páginas dos livros terminados). */
  record_pages_year: { year: number; pages: number } | null;
};

export type NamedCount = { label: string; count: number };

export type ShelfOverview = {
  /** Todos os livros cadastrados. */
  total_books: number;
  /**
   * Livros na estante — mesma definição da página de Livros: `owned` com
   * formato físico, deduplicando volumes que dividem exemplar (bundled).
   */
  on_shelf: number;
  /** Vendidos + trocados (juntos num número só). */
  sold_or_traded: number;
  /** Faixa de páginas de TODOS os livros (não só lidos). */
  shelf_page_buckets: PageBucket[];
  /** Livros sem nº de páginas (fora do histograma). */
  shelf_without_pages: number;
  /** Recorte de leitura da vida toda. */
  reading: ReadingOverview;
  // --- Progresso da estante ---
  /** % dos cadastrados já lidos. */
  read_percent: number;
  /** Soma de páginas de todos os livros cadastrados. */
  total_pages_all: number;
  /** Soma de páginas dos livros já lidos. */
  total_pages_read: number;
  /** Páginas dos livros na estante ainda não lidos (base do tempo restante). */
  unread_shelf_pages: number;
  // --- Perfil do acervo ---
  /** Livros por década de publicação ("<1800", "1800", "1810", …). */
  decades: PageBucket[];
  /** De 2000 em diante, ano a ano (o volume recente merece o zoom). */
  recent_years: PageBucket[];
  /** Ano de publicação mais antigo. */
  oldest_year: number | null;
  /** Top editoras (máx. 8). */
  publishers: NamedCount[];
  /** Origem dos livros (compra, assinatura, presente, …). */
  origins: NamedCount[];
  // --- Investimento ---
  /** Soma dos preços de compra. */
  purchase_total: number;
  /** Preço médio (só livros com preço). */
  purchase_avg: number | null;
  /** Livros com preço cadastrado. */
  purchase_count: number;
  /** Livros marcados com o coração. */
  favorites: number;
};

// =============================================================================
// Histograma de páginas
// =============================================================================

/**
 * Agrupa contagens de páginas em faixas de 100 até 1000, depois "1000+".
 * Faixas vazias nas pontas são cortadas; as internas ficam (continuidade do
 * histograma).
 */
export function bucketizePages(pages: number[]): PageBucket[] {
  const buckets: PageBucket[] = [
    { label: "≤100", count: 0 },
    { label: "101–200", count: 0 },
    { label: "201–300", count: 0 },
    { label: "301–400", count: 0 },
    { label: "401–500", count: 0 },
    { label: "501–600", count: 0 },
    { label: "601–700", count: 0 },
    { label: "701–800", count: 0 },
    { label: "801–900", count: 0 },
    { label: "901–1000", count: 0 },
    { label: "1000+", count: 0 },
  ];
  for (const p of pages) {
    if (p <= 0) continue;
    const idx = p > 1000 ? 10 : Math.min(10, Math.floor((p - 1) / 100));
    buckets[idx].count += 1;
  }
  let first = buckets.findIndex((b) => b.count > 0);
  if (first === -1) return [];
  let last = buckets.length - 1;
  while (last > first && buckets[last].count === 0) last -= 1;
  return buckets.slice(first, last + 1);
}

// =============================================================================
// Recorte de leitura (países + idiomas + páginas dos lidos)
// =============================================================================

type FinishedRaw = {
  rating: number | null;
  finish_date: string | null;
  book: {
    id: string;
    pages: number | null;
    language: BookLanguage | null;
    book_author:
      | { author: { id: string; name: string | null; country: Country | null } | null }[]
      | null;
  } | null;
};

export async function fetchReadingOverview(
  supabase: SupabaseServer,
  userId: string,
  year?: number,
): Promise<ReadingOverview> {
  let query = supabase
    .from("reading")
    .select(
      `rating, finish_date,
       book:book_id(id, pages, language, book_author(author(id, name, country)))`,
    )
    .eq("user_id", userId)
    .eq("status", "finished");
  if (year !== undefined) {
    query = query
      .gte("finish_date", `${year}-01-01`)
      .lte("finish_date", `${year}-12-31`);
  }
  const { data } = await query;
  const rows = (data as unknown as FinishedRaw[] | null) ?? [];

  // Releituras: o livro conta uma vez só nos agregados por livro.
  const books = new Map<
    string,
    {
      pages: number | null;
      language: BookLanguage | null;
      countries: Set<Country>;
      authors: Map<string, string>;
      finishedCount: number;
    }
  >();
  for (const r of rows) {
    if (!r.book) continue;
    const existing = books.get(r.book.id);
    if (existing) {
      existing.finishedCount += 1;
      continue;
    }
    const countries = new Set<Country>();
    const authors = new Map<string, string>();
    for (const ba of r.book.book_author ?? []) {
      if (!ba.author) continue;
      if (ba.author.country) countries.add(ba.author.country);
      if (ba.author.name) authors.set(ba.author.id, ba.author.name);
    }
    books.set(r.book.id, {
      pages: r.book.pages,
      language: r.book.language,
      countries,
      authors,
      finishedCount: 1,
    });
  }

  const total = books.size;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  // Países — um livro com autores de 2 países conta nos dois.
  const byCountry = new Map<Country, number>();
  let withoutCountry = 0;
  for (const b of books.values()) {
    if (b.countries.size === 0) withoutCountry += 1;
    for (const c of b.countries) {
      byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
    }
  }
  const countries: CountryBookCount[] = [...byCountry.entries()]
    .map(([country, count]) => ({ country, count, percent: pct(count) }))
    .sort((a, z) => z.count - a.count);

  // Idiomas.
  const byLanguage = new Map<BookLanguage | null, number>();
  for (const b of books.values()) {
    byLanguage.set(b.language, (byLanguage.get(b.language) ?? 0) + 1);
  }
  const languages: LanguageCount[] = [...byLanguage.entries()]
    .map(([language, count]) => ({ language, count, percent: pct(count) }))
    .sort((a, z) => z.count - a.count);

  // Páginas dos lidos.
  const pages = [...books.values()]
    .map((b) => b.pages)
    .filter((p): p is number => p !== null && p > 0);

  // Autores distintos + mais lido (livros distintos por autor).
  const byAuthor = new Map<string, { name: string; count: number }>();
  for (const b of books.values()) {
    for (const [id, name] of b.authors) {
      const cur = byAuthor.get(id) ?? { name, count: 0 };
      cur.count += 1;
      byAuthor.set(id, cur);
    }
  }
  let topAuthor: { name: string; count: number } | null = null;
  for (const a of byAuthor.values()) {
    if (!topAuthor || a.count > topAuthor.count) topAuthor = a;
  }

  // Relidos (2+ leituras finalizadas do mesmo livro).
  const rereadBooks = [...books.values()].filter(
    (b) => b.finishedCount >= 2,
  ).length;

  // Notas (todas as leituras finalizadas, releituras contam).
  const ratings = rows
    .map((r) => r.rating)
    .filter((n): n is number => n !== null);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, n) => s + n, 0) / ratings.length) * 10) /
        10
      : null;
  const fiveStars = ratings.filter((n) => n >= 5).length;

  // Anos recorde (livros e páginas por ano de finish_date).
  const booksByYear = new Map<number, number>();
  const pagesByYear = new Map<number, number>();
  const seenBookYear = new Set<string>();
  for (const r of rows) {
    if (!r.finish_date || !r.book) continue;
    const y = Number(r.finish_date.slice(0, 4));
    const key = `${r.book.id}-${y}`;
    if (seenBookYear.has(key)) continue; // releitura no mesmo ano não duplica
    seenBookYear.add(key);
    booksByYear.set(y, (booksByYear.get(y) ?? 0) + 1);
    if (r.book.pages && r.book.pages > 0) {
      pagesByYear.set(y, (pagesByYear.get(y) ?? 0) + r.book.pages);
    }
  }
  let recordBooks: { year: number; books: number } | null = null;
  for (const [y, n] of booksByYear) {
    if (!recordBooks || n > recordBooks.books) recordBooks = { year: y, books: n };
  }
  let recordPages: { year: number; pages: number } | null = null;
  for (const [y, n] of pagesByYear) {
    if (!recordPages || n > recordPages.pages) recordPages = { year: y, pages: n };
  }

  return {
    read_books_total: total,
    without_country: withoutCountry,
    countries,
    languages,
    page_buckets: bucketizePages(pages),
    authors_read_total: byAuthor.size,
    top_author: topAuthor,
    reread_books: rereadBooks,
    avg_rating: avgRating,
    rated_count: ratings.length,
    five_star_count: fiveStars,
    record_books_year: recordBooks,
    record_pages_year: recordPages,
  };
}

/** Recorte de leitura standalone (usado no resumo do ano e na home). */
export async function getReadingOverview(
  userId: string,
  year?: number,
): Promise<ReadingOverview> {
  const supabase = await createClient();
  return fetchReadingOverview(supabase, userId, year);
}

// =============================================================================
// Visão geral da estante (página /visao-geral)
// =============================================================================

const ORIGIN_LABELS: Record<string, string> = {
  compra: "Compra",
  assinatura: "Assinatura",
  kindle_unlimited: "Kindle Unlimited",
  audible: "Audible",
  presente: "Presente",
  troca: "Troca",
  outro: "Outro",
  nao_informado: "Não informado",
};

/**
 * Décadas de publicação — a partir de 1800 cada década é uma barra (os
 * vitorianos merecem o destaque); "<1800" agrupa o que vier antes.
 */
function bucketizeDecades(years: number[]): {
  decades: PageBucket[];
  oldest: number | null;
} {
  const valid = years.filter((y) => y > 0 && y <= 2100);
  if (valid.length === 0) return { decades: [], oldest: null };
  const oldest = Math.min(...valid);

  const preCount = valid.filter((y) => y < 1800).length;
  const byDecade = new Map<number, number>();
  for (const y of valid) {
    if (y < 1800) continue;
    const d = Math.floor(y / 10) * 10;
    byDecade.set(d, (byDecade.get(d) ?? 0) + 1);
  }

  const decades: PageBucket[] = [];
  if (preCount > 0) decades.push({ label: "<1800", count: preCount });
  if (byDecade.size > 0) {
    const min = Math.min(...byDecade.keys());
    const max = Math.max(...byDecade.keys());
    for (let d = min; d <= max; d += 10) {
      decades.push({ label: String(d), count: byDecade.get(d) ?? 0 });
    }
  }
  return { decades, oldest };
}

export async function getShelfOverview(userId: string): Promise<ShelfOverview> {
  const supabase = await createClient();

  const [{ data: booksRaw }, { data: finishedRaw }, reading] =
    await Promise.all([
      supabase
        .from("book")
        .select(
          "id, pages, ownership_status, formats_owned, bundled_with, publisher, publication_year, purchase_price, purchase_origin, is_favorite",
        )
        .eq("user_id", userId),
      supabase
        .from("reading")
        .select("book_id")
        .eq("user_id", userId)
        .eq("status", "finished"),
      fetchReadingOverview(supabase, userId),
    ]);

  const books = booksRaw ?? [];
  const readIds = new Set((finishedRaw ?? []).map((r) => r.book_id));

  // "Na estante" = owned + formato físico (mesma regra da página de Livros).
  const isOnShelf = (b: (typeof books)[number]) =>
    b.ownership_status === "owned" &&
    (b.formats_owned ?? []).includes("physical");

  const withPages = books
    .map((b) => b.pages)
    .filter((p): p is number => p !== null && p > 0);
  // Deduplica volumes que dividem exemplar (bundled contam 1) — bate com o
  // "N livros na estante" da página de Livros.
  const onShelf = countPhysicalCopies(books.filter(isOnShelf));
  const soldOrTraded = books.filter(
    (b) => b.ownership_status === "sold" || b.ownership_status === "traded",
  ).length;

  // Progresso: páginas totais, lidas e as que faltam na estante. Páginas NÃO
  // deduplicam bundled — cada título tem seu próprio texto a ler.
  const totalPagesAll = withPages.reduce((s, p) => s + p, 0);
  let totalPagesRead = 0;
  let unreadShelfPages = 0;
  for (const b of books) {
    const p = b.pages ?? 0;
    if (p <= 0) continue;
    if (readIds.has(b.id)) {
      totalPagesRead += p;
    } else if (isOnShelf(b)) {
      unreadShelfPages += p;
    }
  }

  // Décadas de publicação.
  const pubYears = books
    .map((b) => b.publication_year)
    .filter((y): y is number => y !== null);
  const { decades, oldest } = bucketizeDecades(pubYears);

  // De 2000 em diante: ano a ano, sem buracos.
  const byRecentYear = new Map<number, number>();
  for (const y of pubYears) {
    if (y < 2000 || y > 2100) continue;
    byRecentYear.set(y, (byRecentYear.get(y) ?? 0) + 1);
  }
  const recentYears: PageBucket[] = [];
  if (byRecentYear.size > 0) {
    const min = Math.min(...byRecentYear.keys());
    const max = Math.max(...byRecentYear.keys());
    for (let y = min; y <= max; y += 1) {
      recentYears.push({ label: String(y), count: byRecentYear.get(y) ?? 0 });
    }
  }

  // Top editoras (nome normalizado leve: trim).
  const byPublisher = new Map<string, number>();
  for (const b of books) {
    const name = b.publisher?.trim();
    if (!name) continue;
    byPublisher.set(name, (byPublisher.get(name) ?? 0) + 1);
  }
  const publishers: NamedCount[] = [...byPublisher.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, z) => z.count - a.count)
    .slice(0, 8);

  // Origem dos livros.
  const byOrigin = new Map<string, number>();
  for (const b of books) {
    const key = b.purchase_origin ?? "nao_informado";
    byOrigin.set(key, (byOrigin.get(key) ?? 0) + 1);
  }
  const origins: NamedCount[] = [...byOrigin.entries()]
    .map(([key, count]) => ({ label: ORIGIN_LABELS[key] ?? key, count }))
    .sort((a, z) => z.count - a.count);

  // Investimento.
  const prices = books
    .map((b) => b.purchase_price)
    .filter((p): p is number => p !== null && p > 0);
  const purchaseTotal = prices.reduce((s, p) => s + p, 0);

  return {
    total_books: books.length,
    on_shelf: onShelf,
    sold_or_traded: soldOrTraded,
    shelf_page_buckets: bucketizePages(withPages),
    shelf_without_pages: books.length - withPages.length,
    reading,
    read_percent:
      books.length > 0
        ? Math.round((reading.read_books_total / books.length) * 100)
        : 0,
    total_pages_all: totalPagesAll,
    total_pages_read: totalPagesRead,
    unread_shelf_pages: unreadShelfPages,
    decades,
    recent_years: recentYears,
    oldest_year: oldest,
    publishers,
    origins,
    purchase_total: purchaseTotal,
    purchase_avg:
      prices.length > 0
        ? Math.round((purchaseTotal / prices.length) * 100) / 100
        : null,
    purchase_count: prices.length,
    favorites: books.filter((b) => b.is_favorite).length,
  };
}
