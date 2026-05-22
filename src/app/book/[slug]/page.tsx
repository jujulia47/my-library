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

  const bundledIds = ((book.bundled_with ?? []) as string[]).filter(
    (bid) => bid !== book.id,
  );

  const [
    { data: bookAuthors },
    { data: bookCategories },
    { data: readings },
    { data: quotes },
    { data: history },
    { data: bundledBooksRaw },
    { data: groupRaw },
    { data: groupBookCountRaw },
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
    bundledIds.length > 0
      ? supabase
          .from("book")
          .select("id, slug, title")
          .in("id", bundledIds)
      : Promise.resolve({ data: [] }),
    book.purchase_group_id
      ? supabase
          .from("purchase_group")
          .select("id, name, total_price")
          .eq("id", book.purchase_group_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    book.purchase_group_id
      ? supabase
          .from("book")
          .select("id")
          .eq("purchase_group_id", book.purchase_group_id)
      : Promise.resolve({ data: [] }),
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

  const bundled = (bundledBooksRaw ?? []) as {
    id: string;
    slug: string;
    title: string;
  }[];

  const groupRow = groupRaw as {
    id: string;
    name: string;
    total_price: number;
  } | null;
  const groupBookCount = (groupBookCountRaw ?? []).length;
  const purchaseGroup = groupRow
    ? {
        id: groupRow.id,
        name: groupRow.name,
        total_price: Number(groupRow.total_price),
        book_count: groupBookCount,
      }
    : null;

  // table_of_contents vem como jsonb — parse defensivo pra desconfiar de
  // estruturas inesperadas.
  type TocItem = { title: string; page_start: number | null };
  const tocRaw = book.table_of_contents;
  const tableOfContents: TocItem[] = Array.isArray(tocRaw)
    ? (tocRaw as unknown[])
        .filter(
          (it): it is { title: unknown; page_start?: unknown } =>
            !!it && typeof it === "object",
        )
        .map((it) => ({
          title:
            typeof (it as { title?: unknown }).title === "string"
              ? ((it as { title: string }).title as string)
              : "",
          page_start:
            typeof (it as { page_start?: unknown }).page_start === "number"
              ? ((it as { page_start: number }).page_start as number)
              : null,
        }))
        .filter((it) => it.title.length > 0)
    : [];

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
          wont_read: book.wont_read,
          purchase_origin: book.purchase_origin,
          purchase_price:
            book.purchase_price !== null ? Number(book.purchase_price) : null,
          acquired_at: book.acquired_at,
          borrowed_from: book.borrowed_from,
          borrowed_at: book.borrowed_at,
          returned_at: book.returned_at,
          returned_to_acervo_at: book.returned_to_acervo_at,
          lent_to: book.lent_to,
          subscription,
          bundled,
          table_of_contents: tableOfContents,
          purchase_group: purchaseGroup,
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
