import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { imagesUrl } from "@/services/images";
import BookDetailClient, {
  type ReadingItem,
  type QuoteItem,
  type BookStatusHistoryItem,
} from "@/components/DetailsPage/BookDetailClient";
import type { Database } from "@/utils/typings/supabase";

type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];
type ReadingEventRow = Database["public"]["Tables"]["reading_event"]["Row"];

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("book")
    .select(
      "*, serie:serie!book_serie_id_fkey(name, slug), subscription(id, name)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!book) notFound();

  const [
    { data: bookAuthors },
    { data: bookCategories },
    { data: readings },
    { data: quotes },
    { data: history },
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
      .select("*, reading_event(id, event_type, event_date, notes)")
      .eq("book_id", book.id)
      .order("finish_date", { ascending: false, nullsFirst: false })
      .order("start_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("quote")
      .select("id, slug, text, page, chapter, author_name, note")
      .eq("book_id", book.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("book_status_history")
      .select("id, status, changed_at, notes")
      .eq("book_id", book.id)
      .order("changed_at", { ascending: true }),
  ]);

  const authors = (bookAuthors ?? [])
    .map((row) => row.author)
    .filter((a): a is { id: string; name: string } => !!a);
  const categories = (bookCategories ?? [])
    .map((row) => row.category)
    .filter((c): c is { id: string; name: string } => !!c);

  type ReadingWithEvents = ReadingRow & {
    reading_event?:
      | Pick<ReadingEventRow, "id" | "event_type" | "event_date" | "notes">[]
      | null;
  };

  const readingItems: ReadingItem[] = (readings ?? []).map(
    (r: ReadingWithEvents) => {
      const events = (r.reading_event ?? [])
        .map((ev) => ({
          id: ev.id,
          event_type: ev.event_type,
          event_date: ev.event_date,
          notes: ev.notes,
        }))
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
      return {
        id: r.id,
        status: r.status,
        format: r.format,
        start_date: r.start_date,
        finish_date: r.finish_date,
        current_page: r.current_page,
        rating: r.rating,
        review: r.review,
        events,
      };
    },
  );

  const quoteItems: QuoteItem[] = (quotes ?? []) as QuoteItem[];
  const statusHistory: BookStatusHistoryItem[] = (history ?? []).map((h) => ({
    id: h.id,
    status: h.status,
    changed_at: h.changed_at,
    notes: h.notes,
  }));

  const serie = (book.serie as { name: string; slug: string } | null) ?? null;
  const subscription =
    (book.subscription as { id: string; name: string } | null) ?? null;

  return (
    <AppShell>
      <BookDetailClient
        book={{
          id: book.id,
          slug: book.slug,
          title: book.title,
          original_title: book.original_title,
          isbn: book.isbn,
          publisher: book.publisher,
          publication_year: book.publication_year,
          synopsis: book.synopsis,
          pages: book.pages,
          language: book.language,
          cover: book.cover,
          cover_url: imagesUrl(book.cover ?? ""),
          serie_id: book.serie_id,
          serie_name: serie?.name ?? null,
          serie_slug: serie?.slug ?? null,
          volume: book.volume,
          ownership_status: book.ownership_status,
          disposed_date: book.disposed_date,
          formats_owned: book.formats_owned,
          comments: book.comments,
          is_favorite: book.is_favorite,
          purchase_origin: book.purchase_origin,
          purchase_price:
            book.purchase_price !== null ? Number(book.purchase_price) : null,
          acquired_at: book.acquired_at,
          borrowed_from: book.borrowed_from,
          lent_to: book.lent_to,
          subscription,
        }}
        authors={authors}
        categories={categories}
        readings={readingItems}
        quotes={quoteItems}
        statusHistory={statusHistory}
      />
    </AppShell>
  );
}
