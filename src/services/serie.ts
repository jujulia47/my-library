"use server";

import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type SerieRead = Database["public"]["Tables"]["serie"]["Row"];
type SerieUpdate = Database["public"]["Tables"]["serie"]["Update"];

type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];

type BookWithVolume = Book & { volume: number | null };

type SerieWithBooks = Serie & {
  book: BookWithVolume[];
};

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

export async function serieSlug(slug: string) {
  const { data, error } = await supabase
    .from("serie")
    .select(`*, book!book_serie_id_fkey(id, title, cover, rating, status, volume, author)`)
    .eq("slug", slug)
    .overrideTypes<SerieWithBooks[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}