"use server";

import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type BookUpdate = Database["public"]["Tables"]["book"]["Update"];
type BookRead = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];

// tipo para book com o relacionamento serie carregado
type BookWithSerie = BookRead & {
  serie: Serie | null;
};

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

export async function bookSlug(slug: string) {
  const { data, error } = await supabase
    .from("book")
    .select(`*, serie!book_serie_id_fkey(*)`)
    .eq("slug", slug)
    .overrideTypes<BookWithSerie[]>();

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
    .select(`*`)
    .order("id", { ascending: true })
    .overrideTypes<BookRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

