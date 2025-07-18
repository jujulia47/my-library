import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type QuoteRead = Database["public"]["Tables"]["quote"]["Row"];
type QuoteUpdate = Database["public"]["Tables"]["quote"]["Update"];
type Book = Database["public"]["Tables"]["book"]["Row"];


type QuoteWithBook = QuoteRead & {
  book: Book | null;
};

export async function quoteList() {
  const { data, error } = await supabase
    .from("quote")
    .select(`*, book(id, title)`)
    .overrideTypes<QuoteRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data;
}

export async function quoteById(id: number) {
  const { data, error } = await supabase
    .from("quote")
    .select()
    .eq("id", id)
    .overrideTypes<QuoteUpdate[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data;
}

export async function quoteSlug(slug: string) {
  const { data, error } = await supabase
    .from("quote")
    .select(`*, book(id, title, author)`)    
    .eq("slug", slug)
    .overrideTypes<QuoteWithBook[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}
