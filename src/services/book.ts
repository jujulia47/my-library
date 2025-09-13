"use server";

import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type BookUpdate = Database["public"]["Tables"]["book"]["Update"];
type BookRead = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];
type Quote = Database["public"]["Tables"]["quote"]["Row"];

// tipo para book com o relacionamento serie carregado
type BookWithSerie = BookRead & {
  serie: Serie | null;
  quote: Quote[];
};

const SEARCH_COUNT_LIMIT = 5;

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
    .select(`*, serie!book_serie_id_fkey(*), quote(*)`)
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
    .order("id", { ascending: false })
    .overrideTypes<BookRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

export async function authorAutoComplete(query: string) {
  if (!query || query.length < 2) return [];
  //query => Palavra que o usuário está digitando no input
  //query.length < 2 => Garante que o usuário digite pelo menos 2 caracteres
  //ilike => Igual ao LIKE do SQL, mas com case-insensitive
  //limit => Limita o número de resultados

  const { data, error } = await supabase
    .from("book")
    .select("author",)
    .ilike("author", `%${query}%`) // Match only rows where column matches pattern case-insensitively.
    .limit(10) // pode ser um pouco maior
    .overrideTypes<BookRead[]>();


  if (error) {
    console.log(error);
    return [];
  }

  console.log("data", data);
  //Data vai retornar um array de objetos em todas as rows que der match na query, ou seja, pode retornar valores repetidos
  //EX: 
  // [
  //   { author: 'Sarah J. Maas' },
  //   { author: 'Sara Raasch' },
  //   { author: 'Sarah MacLean' },
  //   { author: 'Sarah MacLean' },
  //   { author: 'Sarah J. Maas' },
  //   { author: 'Sarah J. Maas' },
  //   { author: 'Sarah MacLean' },
  //   { author: 'Sarah MacLean' },
  //   { author: 'Sarah J. Maas' },
  //   { author: 'Sarah J. Maas' }
  // ]

  // remover valores duplicados
  //Ao invés de usar só o map para retornar os valores, usamos o Set para remover o que está duplicado
  // new Set() => Cria um novo Set, que é uma coleção de valores únicos
  // A Set is a collection of "unique values", meaning it can only store distinct elements, and any attempts to add duplicate values will be ignored.
  // Por ser "unique values" tudo o que estiver repetido, não entra no "novo array", mas apenas um valor de cada

  const uniqueAuthor = Array.from(
    new Set(
      data
        ?.map((author: BookRead) => author.author?.trim()) // remove espaços extras
        .filter((a: string) => a && a.length > 0) // ignora nulos ou strings vazias
    )
  );

  return uniqueAuthor;
}


export async function categoryAutoComplete(query: string) {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from("book")
    .select("category",)
    .ilike("category", `%${query}%`)
    .limit(5)
    .overrideTypes<BookRead[]>();

  if (error) {
    console.log(error);
    return [];
  }

  const uniqueCategory = Array.from(
    new Set(
      data
        ?.map((category: BookRead) => category.category?.trim())
        .filter((category): category is string => category !== undefined)
    )
  );
  return uniqueCategory;
}

export async function searchBooks(query: string, limit: number) {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from("book")
    .select("id, title, author, category, slug")
    .or(
      `title.ilike.%${query}%,author.ilike.%${query}%,category.ilike.%${query}%`
    )
    .limit(limit)
    .overrideTypes<BookRead[]>();

  if (error) {
    console.log(error);
    return [];
  }

  // const uniqueCategory = Array.from(
  //   new Set(
  //     data
  //       ?.map((category: BookRead) => category.category?.trim())
  //       .filter((category): category is string => category !== undefined)
  //   )
  // );
  return data;
}