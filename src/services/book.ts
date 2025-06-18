"use server";

import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type Book = Database["public"]["Tables"]["book"]["Update"];

export async function bookList(id: any) {
  console.log("get book", id);
  
  const { data, error } = await supabase
    .from("book")
    .select()
    .eq("id", id)
    .overrideTypes<Book[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

