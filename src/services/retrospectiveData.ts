import { createClient } from "@/utils/supabase/server";
import { getUserSecondsPerPage } from "@/services/readingPace";
import { COUNTRY_CODES } from "@/utils/countryLabels";
import type { Database } from "@/utils/typings/supabase";
import type { FingerprintGenre } from "@/services/fingerprintData";

type Country = Database["public"]["Enums"]["country"];

/** País → continente (mesmo mapa do passaporte). */
const CONTINENT: Record<Country, string> = {
  africa_do_sul: "África", angola: "África", cabo_verde: "África",
  egito: "África", mocambique: "África",
  argentina: "América do Sul", brasil: "América do Sul", chile: "América do Sul",
  colombia: "América do Sul", peru: "América do Sul",
  canada: "América do Norte", cuba: "América do Norte",
  estados_unidos: "América do Norte", mexico: "América do Norte",
  china: "Ásia", coreia_do_sul: "Ásia", india: "Ásia", israel: "Ásia",
  japao: "Ásia", turquia: "Ásia",
  alemanha: "Europa", espanha: "Europa", franca: "Europa", holanda: "Europa",
  hungria: "Europa", irlanda: "Europa", italia: "Europa", noruega: "Europa",
  polonia: "Europa", portugal: "Europa", reino_unido: "Europa",
  republica_tcheca: "Europa", russia: "Europa", suecia: "Europa",
  australia: "Oceania",
  venezuela: "América do Sul",
  quenia: "África",
  dinamarca: "Europa",
  niassalandia: "África",
  suica: "Europa",
  jerusalem: "Ásia",
};

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export type RetroGenre = { name: string; count: number; percent: number };

export type RetrospectiveData = {
  year: number;
  holder: string | null;
  books: number;
  pages: number;
  hours: number;
  countries: number;
  continents: number;
  authors: number;
  genres: RetroGenre[];
  topGenre: string | null;
  bestMonth: { name: string; count: number } | null;
  topBook: { title: string; author: string | null; rating: number | null } | null;
  fiveStarCount: number;
  /** ISO2 (minúsculo) dos países visitados no ano, pras bandeiras. */
  countryList: string[];
  rating: number | null;
  /** Entrada da impressão digital (arte do cartão final). */
  fingerprintGenres: FingerprintGenre[];
};

type ReadingRow = {
  rating: number | null;
  finish_date: string | null;
  book: {
    id: string;
    title: string;
    pages: number | null;
    book_author: { author: { id: string; name: string | null; country: Country | null } | null }[] | null;
    book_category: { category: { id: string; name: string } | null }[] | null;
  } | null;
};

export async function getRetrospective(
  userId: string,
  year: number,
): Promise<RetrospectiveData> {
  const supabase = await createClient();

  const [{ data: readingsRaw }, { data: profile }, secondsPerPage] =
    await Promise.all([
      supabase
        .from("reading")
        .select(
          "rating, finish_date, book:book_id(id, title, pages, book_author(author(id, name, country)), book_category(category(id, name)))",
        )
        .eq("user_id", userId)
        .eq("status", "finished")
        .gte("finish_date", `${year}-01-01`)
        .lte("finish_date", `${year}-12-31`),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userId)
        .maybeSingle(),
      getUserSecondsPerPage(userId),
    ]);

  const readings = (readingsRaw as unknown as ReadingRow[] | null) ?? [];

  const seenBooks = new Set<string>();
  const catCount = new Map<string, { name: string; count: number }>();
  const countries = new Set<Country>();
  const continents = new Set<string>();
  const authors = new Set<string>();
  const byMonth = new Map<number, Set<string>>();
  let pagesTotal = 0;

  for (const r of readings) {
    if (!r.book) continue;
    const first = !seenBooks.has(r.book.id);
    if (first) {
      seenBooks.add(r.book.id);
      pagesTotal += r.book.pages ?? 0;

      const seenCat = new Set<string>();
      for (const bc of r.book.book_category ?? []) {
        const cat = bc.category;
        if (!cat || seenCat.has(cat.id)) continue;
        seenCat.add(cat.id);
        const cur = catCount.get(cat.id) ?? { name: cat.name, count: 0 };
        cur.count += 1;
        catCount.set(cat.id, cur);
      }
      for (const ba of r.book.book_author ?? []) {
        if (ba.author?.id) authors.add(ba.author.id);
        if (ba.author?.country) {
          countries.add(ba.author.country);
          continents.add(CONTINENT[ba.author.country]);
        }
      }
    }
    if (r.finish_date) {
      const m = Number(r.finish_date.slice(5, 7)) - 1;
      (byMonth.get(m) ?? byMonth.set(m, new Set()).get(m)!).add(r.book.id);
    }
  }

  const books = seenBooks.size;
  const hours = Math.round((pagesTotal * secondsPerPage) / 3600);

  const sortedCats = [...catCount.values()].sort((a, b) => b.count - a.count);
  const genres: RetroGenre[] = sortedCats.slice(0, 6).map((c) => ({
    name: c.name,
    count: c.count,
    percent: books > 0 ? Math.round((c.count / books) * 100) : 0,
  }));
  const fingerprintGenres: FingerprintGenre[] = sortedCats
    .slice(0, 8)
    .map((c) => ({ name: c.name, count: c.count }));

  // Melhor mês (mais livros terminados).
  let bestMonth: { name: string; count: number } | null = null;
  for (const [m, set] of byMonth) {
    if (!bestMonth || set.size > bestMonth.count) {
      bestMonth = { name: MONTHS_FULL[m], count: set.size };
    }
  }

  // Livro do ano: maior nota (desempate: mais recente).
  let topReading: ReadingRow | null = null;
  const fiveStarBooks = new Set<string>();
  for (const r of readings) {
    if (!r.book || r.rating == null) continue;
    if (r.rating >= 5) fiveStarBooks.add(r.book.id);
    if (
      !topReading ||
      (r.rating ?? 0) > (topReading.rating ?? 0) ||
      ((r.rating ?? 0) === (topReading.rating ?? 0) &&
        (r.finish_date ?? "") > (topReading.finish_date ?? ""))
    ) {
      topReading = r;
    }
  }
  const topBook = topReading?.book
    ? {
        title: topReading.book.title,
        author:
          topReading.book.book_author?.find((ba) => ba.author?.name)?.author
            ?.name ?? null,
        rating: topReading.rating,
      }
    : null;

  const ratings = readings
    .map((r) => r.rating)
    .filter((n): n is number => n !== null);
  const rating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, n) => s + n, 0) / ratings.length) * 10) /
        10
      : null;

  const countryList = [...countries].map((c) =>
    COUNTRY_CODES[c].toLowerCase(),
  );

  return {
    year,
    holder: (profile?.display_name as string | undefined)?.trim() || null,
    books,
    pages: pagesTotal,
    hours,
    countries: countries.size,
    continents: continents.size,
    authors: authors.size,
    genres,
    topGenre: genres[0]?.name ?? null,
    bestMonth,
    topBook,
    fiveStarCount: fiveStarBooks.size,
    countryList,
    rating,
    fingerprintGenres,
  };
}
