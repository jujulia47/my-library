import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import SerieDetailClient, {
  type SerieVolumeBook,
} from "@/components/DetailsPage/SerieDetailClient";
import { createClient } from "@/utils/supabase/server";
import { deriveSerieDates, resolveSerieDates } from "@/services/serieDates";
import { deriveLastActivity } from "@/services/serieLastActivity";
import type { Database } from "@/utils/typings/supabase";

type SerieRow = Database["public"]["Tables"]["serie"]["Row"];
type BookRow = Database["public"]["Tables"]["book"]["Row"];
type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];
type ReadingEventRow = Database["public"]["Tables"]["reading_event"]["Row"];

type RawBook = Pick<
  BookRow,
  "id" | "slug" | "title" | "cover" | "volume" | "pages"
> & {
  book_author?: { author: { name: string } | null }[] | null;
  reading?:
    | (ReadingRow & {
        reading_event?:
          | Pick<ReadingEventRow, "event_type" | "created_at">[]
          | null;
      })[]
    | null;
};

type RawSerie = SerieRow & {
  book?: RawBook[] | null;
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("serie")
    .select(
      `*, book!book_serie_id_fkey(id, slug, title, cover, volume, pages, book_author(author(name)), reading(*, reading_event(event_type, created_at)))`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const raw = data as RawSerie;
  const rawBooks = raw.book ?? [];

  const books: SerieVolumeBook[] = rawBooks
    .map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      cover: b.cover,
      volume: b.volume,
      pages: b.pages,
      readings: (b.reading ?? []).map((r) => ({
        status: r.status,
        start_date: r.start_date,
        finish_date: r.finish_date,
        current_page: r.current_page,
        rating: r.rating,
        updated_at: r.updated_at,
      })),
    }))
    .sort((a, b) => {
      if (a.volume == null && b.volume == null) return 0;
      if (a.volume == null) return 1;
      if (b.volume == null) return -1;
      return a.volume - b.volume;
    });

  // Autores distintos derivados, preservando ordem de aparição (volume asc).
  const seen = new Set<string>();
  const authors: string[] = [];
  for (const b of rawBooks) {
    for (const ba of b.book_author ?? []) {
      const n = ba.author?.name;
      if (n && !seen.has(n)) {
        seen.add(n);
        authors.push(n);
      }
    }
  }

  const derivedDates = deriveSerieDates(books);
  const resolvedDates = resolveSerieDates(derivedDates, {
    start_date: raw.start_date,
    finish_date: raw.finish_date,
  });

  // Última atividade enriquecida — caracteriza o tipo (event vs update de
  // campo) pra exibição mais informativa no card.
  const lastActivity = deriveLastActivity(
    rawBooks.map((b) => ({
      title: b.title,
      slug: b.slug,
      readings: (b.reading ?? []).map((r) => ({
        updated_at: r.updated_at,
        events: (r.reading_event ?? []).map((ev) => ({
          event_type: ev.event_type,
          created_at: ev.created_at,
        })),
      })),
    })),
  );

  // Pra passar pra prop `serie` do client, sem o aninhamento de book.
  const serieRow: SerieRow = {
    created_at: raw.created_at,
    description: raw.description,
    finish_date: raw.finish_date,
    id: raw.id,
    name: raw.name,
    name_normalized: raw.name_normalized ?? null,
    qty_volumes: raw.qty_volumes,
    rating: raw.rating,
    review: raw.review,
    slug: raw.slug,
    start_date: raw.start_date,
    status: raw.status,
    updated_at: raw.updated_at,
    user_id: raw.user_id,
  };

  return (
    <AppShell>
      <SerieDetailClient
        serie={serieRow}
        authors={authors}
        books={books}
        resolvedDates={resolvedDates}
        lastActivity={lastActivity}
      />
    </AppShell>
  );
}
