import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";
import type { BookWithLegacyShape } from "@/utils/typings/app";

type BookRow = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];
type Quote = Database["public"]["Tables"]["quote"]["Row"];
type Reading = Database["public"]["Tables"]["reading"]["Row"];
type Author = Database["public"]["Tables"]["author"]["Row"];

export type { BookWithLegacyShape };

function flattenBook(
  raw: BookRow & {
    book_author?: { author: Pick<Author, "name"> | null }[] | null;
    reading?: Reading[] | null;
    serie?: Serie | null;
    quote?: Quote[];
  },
): BookWithLegacyShape {
  const authors =
    raw.book_author
      ?.map((ba) => ba.author?.name)
      .filter((n): n is string => !!n) ?? [];
  const latestReading = raw.reading?.[0] ?? null;
  return {
    ...raw,
    author: authors.join(", "),
    status: latestReading?.status ?? null,
    init_date: latestReading?.start_date ?? null,
    finish_date: latestReading?.finish_date ?? null,
    current_page: latestReading?.current_page ?? null,
    rating: latestReading?.rating ?? null,
    reading: raw.reading ?? null,
    serie: raw.serie ?? null,
    quote: raw.quote ?? [],
  };
}

export async function bookById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book")
    .select(
      `*, book_author(author(name)), reading(*), serie!book_serie_id_fkey(*)`,
    )
    .eq("id", id);
  if (error) return null;
  return data?.map(flattenBook) ?? null;
}

export async function bookSlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book")
    .select(
      `*, book_author(author(name)), reading(*), serie!book_serie_id_fkey(*), quote(*)`,
    )
    .eq("slug", slug);
  if (error) return null;
  return data?.map(flattenBook) ?? null;
}

export async function bookList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book")
    .select(`*, book_author(author(name)), reading(*)`)
    .order("created_at", { ascending: true });
  if (error) return null;
  return data?.map(flattenBook) ?? null;
}
