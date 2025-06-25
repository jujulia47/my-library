import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type QuoteRead = Database["public"]["Tables"]["quote"]["Row"];

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
