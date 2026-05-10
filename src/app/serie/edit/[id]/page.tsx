import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import SerieFull from "@/components/Update/SerieFull";
import { createClient } from "@/utils/supabase/server";
import { deriveSerieDates } from "@/services/serieDates";
import type { Database } from "@/utils/typings/supabase";

type SerieRow = Database["public"]["Tables"]["serie"]["Row"];
type BookRow = Database["public"]["Tables"]["book"]["Row"];
type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];

type RawSerie = SerieRow & {
  book?:
    | (Pick<BookRow, "id" | "title" | "volume"> & {
        reading?: ReadingRow[] | null;
      })[]
    | null;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("serie")
    .select(
      `*, book!book_serie_id_fkey(id, title, volume, reading(status, start_date, finish_date))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const raw = data as RawSerie;
  const rawBooks = raw.book ?? [];

  const derivedDates = deriveSerieDates(
    rawBooks.map((b) => ({
      readings: (b.reading ?? []).map((r) => ({
        status: r.status,
        start_date: r.start_date,
        finish_date: r.finish_date,
      })),
    })),
  );

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
      <SerieFull
        serie={serieRow}
        derivedDates={derivedDates}
      />
    </AppShell>
  );
}
