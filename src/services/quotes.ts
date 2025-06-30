import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type QuoteRead = Database["public"]["Tables"]["quote"]["Row"];
type QuoteUpdate = Database["public"]["Tables"]["quote"]["Update"];

export async function quoteList() {
  const { data, error } = await supabase
    .from("quote")
    .select()
    .overrideTypes<QuoteRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
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

  return data
}
