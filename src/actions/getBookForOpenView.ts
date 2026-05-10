"use server";

import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import type { BookForOpenView } from "@/components/Library/BookOpenView";
import type { Database } from "@/utils/typings/supabase";

type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];
type ReadingEventRow = Database["public"]["Tables"]["reading_event"]["Row"];

/**
 * Sessão 17.5: extraído do `/library/book/[slug]/page.tsx` pra que o
 * overlay do livro abrindo (LibraryWall state-driven) consiga buscar a
 * estrutura completa via server action sem trocar de rota.
 *
 * Retorna `null` se livro não existe ou não pertence ao user — o consumer
 * decide o fallback (ex.: ignorar click silenciosamente).
 */
export async function getBookForOpenView(
  slug: string,
): Promise<BookForOpenView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: book } = await supabase
    .from("book")
    .select(`*, serie:serie!book_serie_id_fkey(name, slug)`)
    .eq("slug", slug)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!book) return null;

  const [
    { data: bookAuthors },
    { data: bookCategories },
    { data: readings },
    { data: quotes },
    { data: collectionItems },
  ] = await Promise.all([
    supabase
      .from("book_author")
      .select("author:author_id(id, name)")
      .eq("book_id", book.id),
    supabase
      .from("book_category")
      .select("category:category_id(id, name)")
      .eq("book_id", book.id),
    supabase
      .from("reading")
      .select(
        `id, status, start_date, finish_date, rating, review,
         reading_event(event_type, event_date)`,
      )
      .eq("book_id", book.id)
      .order("finish_date", { ascending: false, nullsFirst: false })
      .order("start_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("quote")
      .select("id, slug, text, page")
      .eq("book_id", book.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("collection_item")
      .select("collection:collection_id(id, slug, name)")
      .eq("book_id", book.id),
  ]);

  type AuthorJoin = { author: { id: string; name: string } | null };
  type CategoryJoin = { category: { id: string; name: string } | null };
  type CollectionJoin = {
    collection: { id: string; slug: string; name: string } | null;
  };
  type ReadingWithEvents = ReadingRow & {
    reading_event:
      | Pick<ReadingEventRow, "event_type" | "event_date">[]
      | null;
  };

  const authors = ((bookAuthors as AuthorJoin[] | null) ?? [])
    .map((row) => row.author)
    .filter((a): a is { id: string; name: string } => !!a);
  const categories = ((bookCategories as CategoryJoin[] | null) ?? [])
    .map((row) => row.category)
    .filter((c): c is { id: string; name: string } => !!c);
  const collections = ((collectionItems as CollectionJoin[] | null) ?? [])
    .map((row) => row.collection)
    .filter(
      (c): c is { id: string; slug: string; name: string } => !!c,
    );

  const readingsList = ((readings as ReadingWithEvents[] | null) ?? []).map(
    (r) => ({
      id: r.id,
      status: r.status,
      start_date: r.start_date,
      finish_date: r.finish_date,
      rating: r.rating,
      review: r.review,
      events: (r.reading_event ?? []).map((ev) => ({
        event_type: ev.event_type,
        event_date: ev.event_date,
      })),
    }),
  );

  const serie =
    (book.serie as { name: string; slug: string } | null) ?? null;

  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    original_title: book.original_title,
    cover_url: book.cover ? imagesUrl(book.cover) : null,
    publisher: book.publisher,
    publication_year: book.publication_year,
    pages: book.pages,
    language: book.language,
    synopsis: book.synopsis,
    is_favorite: book.is_favorite,
    ownership_status: book.ownership_status,
    authors,
    categories,
    serie: serie
      ? { name: serie.name, slug: serie.slug, volume: book.volume }
      : null,
    readings: readingsList,
    quotes: (quotes ?? []) as BookForOpenView["quotes"],
    collections,
  };
}
