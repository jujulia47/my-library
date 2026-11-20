import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

export type Person = Pick<
  Database["public"]["Tables"]["person"]["Row"],
  "id" | "name"
>;

/** Pessoas da casa (donos possíveis de livros), ordenadas por nome. */
export async function listPeople(): Promise<Person[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("person")
    .select("id, name")
    .order("name", { ascending: true });
  return (data ?? []) as Person[];
}
