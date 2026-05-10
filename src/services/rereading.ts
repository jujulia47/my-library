import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";
import type { RereadingLegacyShape } from "@/utils/typings/app";

type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];

export type { RereadingLegacyShape };

function flatten(row: ReadingRow): RereadingLegacyShape {
  return {
    ...row,
    date_started: row.start_date,
    date_finished: row.finish_date,
  };
}

export async function rereadingList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading")
    .select(`*, book(id, title)`);
  if (error) return null;
  return data?.map((row) => flatten(row as ReadingRow)) ?? null;
}

export async function readById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reading").select().eq("id", id);
  if (error) return null;
  return data?.map((row) => flatten(row as ReadingRow)) ?? null;
}

export async function rereadingByBookId(bookId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading")
    .select(`*, book(id, title)`)
    .eq("book_id", bookId)
    .order("start_date", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => flatten(row as ReadingRow));
}
