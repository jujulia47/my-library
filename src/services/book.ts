"use server";

import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type BookUpdate = Database["public"]["Tables"]["book"]["Update"];
type BookRead = Database["public"]["Tables"]["book"]["Row"];


export async function bookById(id: number) {
  
  const { data, error } = await supabase
    .from("book")
    .select()
    .eq("id", id)
    .overrideTypes<BookUpdate[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

export async function bookList() {
  const { data, error } = await supabase
    .from("book")
    .select()
    .overrideTypes<BookRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

