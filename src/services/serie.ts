"use server";

import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type SerieRead = Database["public"]["Tables"]["serie"]["Row"];
type SerieUpdate = Database["public"]["Tables"]["serie"]["Update"];

export async function serieList() {
  const { data, error } = await supabase
    .from("serie")
    .select(`*, book:book!serie_current_book_id_fkey(id, title)`)
    .overrideTypes<SerieRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

export async function serieById(id: number) {
  
  const { data, error } = await supabase
    .from("serie")
    .select()
    .eq("id", id)
    .overrideTypes<SerieUpdate[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

