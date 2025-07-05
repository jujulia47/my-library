import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type CollectionRead = Database["public"]["Tables"]["collection"]["Row"];
type CollectionUpdate = Database["public"]["Tables"]["collection"]["Update"];
type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];
type Wishlist = Database["public"]["Tables"]["wishlist"]["Row"];
type CollectionBook = Database["public"]["Tables"]["collection_book"]["Row"];
type CollectionSerie = Database["public"]["Tables"]["collection_serie"]["Row"];
type CollectionWishlist = Database["public"]["Tables"]["collection_wishlist"]["Row"];

export async function collectionList() {
  const { data, error } = await supabase
    .from("collection")
    .select()
    .overrideTypes<CollectionRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

export async function collectionById(id: number) {
  
  const { data, error } = await supabase
    .from("collection")
    .select()
    .eq("id", id)
    .overrideTypes<CollectionUpdate[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

export async function getCollectionWithRelations(id: number) {
  // Busca a coleção principal
  const { data: collection, error: collectionError } = await supabase
    .from("collection")
    .select("*")
    .eq("id", id)
    .single();

  if (collectionError) {
    console.log(collectionError);
    return null;
  }

  // Busca livros relacionados
  const { data: books, error: booksError } = await supabase
    .from("collection_book")
    .select("id, book_id, collection_id, book:book_id(id, title)")
    .eq("collection_id", id) as unknown as {
      data: (CollectionBook & { book: Pick<Book, "id" | "title"> | null })[];
      error: any;
    };

  // Busca séries relacionadas
  const { data: series, error: seriesError } = await supabase
    .from("collection_serie")
    .select("id, serie_id, collection_id, serie:serie_id(id, serie_name)")
    .eq("collection_id", id) as unknown as {
      data: (CollectionSerie & { serie: Pick<Serie, "id" | "serie_name"> | null })[];
      error: any;
    };

  // Busca wishlist relacionada
  const { data: wishlist, error: wishlistError } = await supabase
    .from("collection_wishlist")
    .select("id, wishlist_id, collection_id, wishlist:wishlist_id(id, book_name)")
    .eq("collection_id", id) as unknown as {
      data: (CollectionWishlist & { wishlist: Pick<Wishlist, "id" | "book_name"> | null })[];
      error: any;
    };

  if (booksError) console.log(booksError);
  if (seriesError) console.log(seriesError);
  if (wishlistError) console.log(wishlistError);

  return {
    ...collection,
    books: books?.map((b) => ({
      value: b.book?.id?.toString() ?? "",
      label: b.book?.title ?? "",
      id: b.book_id,
      relationId: b.id,
    })) || [],
    series: series?.map((s) => ({
      value: s.serie?.id?.toString() ?? "",
      label: s.serie?.serie_name ?? "",
      id: s.serie_id,
      relationId: s.id,
    })) || [],
    wishlist: wishlist?.map((w) => ({
      value: w.wishlist?.id?.toString() ?? "",
      label: w.wishlist?.book_name ?? "",
      id: w.wishlist_id,
      relationId: w.id,
    })) || [],
  };
}
