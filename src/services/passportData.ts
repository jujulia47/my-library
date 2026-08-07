import { createClient } from "@/utils/supabase/server";
import { COUNTRY_LABELS, COUNTRY_CODES } from "@/utils/countryLabels";
import type { CountryBookCount } from "@/services/overviewData";
import type { Database } from "@/utils/typings/supabase";

type Country = Database["public"]["Enums"]["country"];

/** País → continente (6 continentes; transcontinentais por afinidade cultural). */
const CONTINENT: Record<Country, string> = {
  africa_do_sul: "África",
  angola: "África",
  cabo_verde: "África",
  egito: "África",
  mocambique: "África",
  argentina: "América do Sul",
  brasil: "América do Sul",
  chile: "América do Sul",
  colombia: "América do Sul",
  peru: "América do Sul",
  canada: "América do Norte",
  cuba: "América do Norte",
  estados_unidos: "América do Norte",
  mexico: "América do Norte",
  china: "Ásia",
  coreia_do_sul: "Ásia",
  india: "Ásia",
  israel: "Ásia",
  japao: "Ásia",
  turquia: "Ásia",
  alemanha: "Europa",
  espanha: "Europa",
  franca: "Europa",
  holanda: "Europa",
  hungria: "Europa",
  irlanda: "Europa",
  italia: "Europa",
  noruega: "Europa",
  polonia: "Europa",
  portugal: "Europa",
  reino_unido: "Europa",
  republica_tcheca: "Europa",
  russia: "Europa",
  suecia: "Europa",
  australia: "Oceania",
};

export type PassportStamp = {
  country: Country;
  label: string;
  iso: string;
  continent: string;
  count: number;
  /** Data do 1º carimbo (ISO YYYY-MM-DD) — quando visitou o país. */
  firstDate: string | null;
  books: string[];
};

export type PassportDestino = {
  country: Country;
  label: string;
  iso: string;
  count: number;
  books: string[];
};

export type PassportData = {
  holder: string | null;
  /** Ano de emissão do passaporte (o passaporte é vitalício, não filtra por ano). */
  year: number;
  stamps: PassportStamp[];
  /** Países pintados no mapa-múndi (mesma forma da visão-geral). */
  mapData: CountryBookCount[];
  countriesCount: number;
  continentsCount: number;
  booksCount: number;
  pagesCount: number;
  /** Livros terminados sem nenhum país de autor — não geram carimbo. */
  missingCountry: number;
  destinos: PassportDestino[];
};

type ReadingRow = {
  finish_date: string | null;
  book: {
    id: string;
    title: string;
    pages: number | null;
    book_author: { author: { country: Country | null } | null }[] | null;
  } | null;
};

type TbrRow = {
  id: string;
  title: string;
  book_author: { author: { country: Country | null } | null }[] | null;
};

function countriesOf(
  authors: { author: { country: Country | null } | null }[] | null,
): Country[] {
  const set = new Set<Country>();
  for (const ba of authors ?? []) {
    if (ba.author?.country) set.add(ba.author.country);
  }
  return [...set];
}

export async function getPassport(userId: string): Promise<PassportData> {
  const supabase = await createClient();

  const [{ data: readingsRaw }, { data: tbrRaw }, { data: profile }] =
    await Promise.all([
      supabase
        .from("reading")
        .select(
          "finish_date, book:book_id(id, title, pages, book_author(author(country)))",
        )
        .eq("user_id", userId)
        .eq("status", "finished"),
      supabase
        .from("book")
        .select("id, title, book_author(author(country))")
        .eq("user_id", userId)
        .eq("is_tbr", true),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const readings = (readingsRaw as unknown as ReadingRow[] | null) ?? [];

  type Agg = {
    books: Set<string>;
    titles: string[];
    firstDate: string | null;
    pages: number;
  };
  const byCountry = new Map<Country, Agg>();
  const readBookIds = new Set<string>();
  const noCountryBookIds = new Set<string>();
  let pagesTotal = 0;

  for (const r of readings) {
    if (!r.book) continue;
    const countries = countriesOf(r.book.book_author);
    if (countries.length === 0) {
      noCountryBookIds.add(r.book.id);
      continue;
    }
    if (!readBookIds.has(r.book.id)) {
      readBookIds.add(r.book.id);
      pagesTotal += r.book.pages ?? 0;
    }
    for (const c of countries) {
      const agg =
        byCountry.get(c) ??
        ({ books: new Set(), titles: [], firstDate: null, pages: 0 } as Agg);
      if (!agg.books.has(r.book.id)) {
        agg.books.add(r.book.id);
        if (agg.titles.length < 4) agg.titles.push(r.book.title);
      }
      if (
        r.finish_date &&
        (!agg.firstDate || r.finish_date < agg.firstDate)
      ) {
        agg.firstDate = r.finish_date;
      }
      byCountry.set(c, agg);
    }
  }

  const visited = new Set<Country>(byCountry.keys());

  const stamps: PassportStamp[] = [...byCountry.entries()]
    .map(([country, agg]) => ({
      country,
      label: COUNTRY_LABELS[country],
      iso: COUNTRY_CODES[country].toLowerCase(),
      continent: CONTINENT[country],
      count: agg.books.size,
      firstDate: agg.firstDate,
      books: agg.titles,
    }))
    // Ordem da "viagem": pela data do primeiro carimbo (sem data no fim).
    .sort((a, b) => {
      if (a.firstDate && b.firstDate) return a.firstDate.localeCompare(b.firstDate);
      if (a.firstDate) return -1;
      if (b.firstDate) return 1;
      return b.count - a.count;
    });

  const continents = new Set(stamps.map((s) => s.continent));

  const booksCount = readBookIds.size;
  // Mapa-múndi: % sobre o total de livros que carimbaram (têm país).
  const mapData: CountryBookCount[] = stamps.map((s) => ({
    country: s.country,
    count: s.count,
    percent: booksCount > 0 ? Math.round((s.count / booksCount) * 100) : 0,
  }));

  // Destinos: países da estante TBR que você ainda não visitou.
  const tbr = (tbrRaw as unknown as TbrRow[] | null) ?? [];
  const destMap = new Map<Country, { books: Set<string>; titles: string[] }>();
  for (const b of tbr) {
    for (const c of countriesOf(b.book_author)) {
      if (visited.has(c)) continue;
      const d = destMap.get(c) ?? { books: new Set(), titles: [] };
      if (!d.books.has(b.id)) {
        d.books.add(b.id);
        if (d.titles.length < 4) d.titles.push(b.title);
      }
      destMap.set(c, d);
    }
  }
  const destinos: PassportDestino[] = [...destMap.entries()]
    .map(([country, d]) => ({
      country,
      label: COUNTRY_LABELS[country],
      iso: COUNTRY_CODES[country].toLowerCase(),
      count: d.books.size,
      books: d.titles,
    }))
    .sort((a, b) => b.count - a.count);

  const rawName =
    (profile?.display_name as string | undefined)?.trim() || null;

  return {
    holder: rawName,
    year: new Date().getFullYear(),
    stamps,
    mapData,
    countriesCount: visited.size,
    continentsCount: continents.size,
    booksCount,
    pagesCount: pagesTotal,
    missingCountry: noCountryBookIds.size,
    destinos,
  };
}
