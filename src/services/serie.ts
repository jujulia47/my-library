import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";
import type { SerieWithLegacyShape } from "@/utils/typings/app";

type SerieRow = Database["public"]["Tables"]["serie"]["Row"];
type BookRow = Database["public"]["Tables"]["book"]["Row"];

export type { SerieWithLegacyShape };

function flattenSerie(
  raw: SerieRow & { book?: { id: string; title: string } | null },
): SerieWithLegacyShape {
  return {
    ...raw,
    serie_name: raw.name,
    init_date: raw.start_date,
    book: raw.book ?? null,
  };
}

export async function serieList() {
  // Service legado, ainda consumido por `/` e collection. O campo `book`
  // (livro atual) virou derivação — ver `services/serieDerivedFields.ts`
  // — e fica `null` aqui pra caller que não precisa dele. Caller que
  // precisar deve migrar pro `serieListQuery` em serieList.ts.
  const supabase = await createClient();
  const { data, error } = await supabase.from("serie").select("*");
  if (error) return null;
  return data?.map((row) => flattenSerie(row as SerieRow)) ?? null;
}

export async function serieById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("serie").select().eq("id", id);
  if (error) return null;
  return data?.map((row) => flattenSerie(row as SerieRow)) ?? null;
}

export async function serieSlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("serie")
    .select(
      `*, book!book_serie_id_fkey(id, title, cover, volume, slug)`,
    )
    .eq("slug", slug);
  if (error) return null;

  type SerieWithBooks = SerieRow & { book: BookRow[] };
  const result = (data ?? []).map((row) => {
    const flat = flattenSerie(row as SerieRow);
    return { ...flat, book: (row as unknown as SerieWithBooks).book ?? [] };
  });
  return result;
}
