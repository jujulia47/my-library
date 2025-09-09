import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type RereadingRead = Database["public"]["Tables"]["rereading"]["Row"];
type RereadingUpdate = Database["public"]["Tables"]["rereading"]["Update"];

export async function rereadingList() {
  const { data, error } = await supabase
    .from("rereading")
    .select(`*, book(id, title)`)
    .overrideTypes<RereadingRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }
  return data;
}

export async function readById(id: number) {
  const { data, error } = await supabase
    .from("rereading")
    .select()
    .eq("id", id)
    .overrideTypes<RereadingUpdate[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data;
}

export async function rereadingByBookId(bookId: number) {
  const { data, error } = await supabase
    .from("rereading")
    .select(`*, book(id, title)`)
    .eq("book_id", bookId)
    .order("date_started", { ascending: false })
    .overrideTypes<RereadingRead[]>();

  if (error) {
    console.error("Erro ao buscar releituras:", error);
    return [];
  }

  return data ?? [];
}
