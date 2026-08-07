import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

type Country = Database["public"]["Enums"]["country"];

export type FingerprintGenre = {
  name: string;
  /** Livros lidos (distintos) nessa categoria. */
  count: number;
};

export type FingerprintData = {
  holder: string | null;
  /** Ano corrente — só legenda; a impressão é da vida toda. */
  year: number;
  /** Categorias mais lidas (ordenadas, no máx. 8, com "Outros" no fim). */
  genres: FingerprintGenre[];
  books: number;
  pages: number;
  countries: number;
  rating: number | null;
};

type ReadingRow = {
  rating: number | null;
  book: {
    id: string;
    pages: number | null;
    book_author: { author: { country: Country | null } | null }[] | null;
    book_category: { category: { id: string; name: string } | null }[] | null;
  } | null;
};

/** Quantas categorias viram fatias distintas (o resto é agrupado em "Outros"). */
const MAX_GENRES = 8;

export async function getFingerprint(userId: string): Promise<FingerprintData> {
  const supabase = await createClient();

  const [{ data: readingsRaw }, { data: profile }] = await Promise.all([
    supabase
      .from("reading")
      .select(
        "rating, book:book_id(id, pages, book_author(author(country)), book_category(category(id, name)))",
      )
      .eq("user_id", userId)
      .eq("status", "finished"),
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const readings = (readingsRaw as unknown as ReadingRow[] | null) ?? [];

  const seenBooks = new Set<string>();
  const catCount = new Map<string, { name: string; count: number }>();
  const countries = new Set<Country>();
  let pagesTotal = 0;

  for (const r of readings) {
    if (!r.book || seenBooks.has(r.book.id)) continue;
    seenBooks.add(r.book.id);
    pagesTotal += r.book.pages ?? 0;

    for (const ba of r.book.book_author ?? []) {
      if (ba.author?.country) countries.add(ba.author.country);
    }
    // Categorias distintas do livro (um livro conta 1x por categoria).
    const seenCat = new Set<string>();
    for (const bc of r.book.book_category ?? []) {
      const cat = bc.category;
      if (!cat || seenCat.has(cat.id)) continue;
      seenCat.add(cat.id);
      const cur = catCount.get(cat.id) ?? { name: cat.name, count: 0 };
      cur.count += 1;
      catCount.set(cat.id, cur);
    }
  }

  // Notas de todas as leituras finalizadas (releituras contam).
  const ratings = readings
    .map((r) => r.rating)
    .filter((n): n is number => n !== null);
  const rating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, n) => s + n, 0) / ratings.length) * 10) /
        10
      : null;

  // Top categorias; o excedente vira uma fatia "Outros".
  const sorted = [...catCount.values()].sort((a, b) => b.count - a.count);
  let genres: FingerprintGenre[] = sorted.map((c) => ({
    name: c.name,
    count: c.count,
  }));
  if (genres.length > MAX_GENRES) {
    const head = genres.slice(0, MAX_GENRES - 1);
    const rest = genres.slice(MAX_GENRES - 1);
    const restCount = rest.reduce((s, g) => s + g.count, 0);
    genres = [...head, { name: "Outros", count: restCount }];
  }

  const rawName =
    (profile?.display_name as string | undefined)?.trim() || null;

  return {
    holder: rawName,
    year: new Date().getFullYear(),
    genres,
    books: seenBooks.size,
    pages: pagesTotal,
    countries: countries.size,
    rating,
  };
}
