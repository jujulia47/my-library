import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type CollectionUpdate = Database["public"]["Tables"]["collection"]["Update"];
type CollectionRead = Database["public"]["Tables"]["collection"]["Row"];
type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];
type Wishlist = Database["public"]["Tables"]["wishlist"]["Row"];

type CollectionBook = Database["public"]["Tables"]["collection_book"]["Row"];
type CollectionSerie = Database["public"]["Tables"]["collection_serie"]["Row"];
type CollectionWishlist = Database["public"]["Tables"]["collection_wishlist"]["Row"];


type CollectionBookWithBook = {
  id: number;
  book_id: number;
  book: Book | null;
};

type CollectionSerieWithSerie = {
  id: number;
  serie_id: number;
  serie: Serie | null;
};

type CollectionWishlistWithWishlist = {
  id: number;
  wishlist_id: number;
  wishlist: Wishlist | null;
};

type CollectionWithRelations = CollectionRead & {
  collection_book: CollectionBookWithBook[];
  collection_serie: CollectionSerieWithSerie[];
  collection_wishlist: CollectionWishlistWithWishlist[];
};

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
  const { data, error } = await supabase
    .from("collection")
    .select(`
      *,
      collection_book(
        id,
        book_id,
        book:book_id(id, title)
      ),
      collection_serie(
        id,
        serie_id,
        serie:serie_id(id, serie_name)
      ),
      collection_wishlist(
        id,
        wishlist_id,
        wishlist:wishlist_id(id, book_name)
      )
    `)
    .eq("id", id)
    .single(); // retorna um único objeto ao invés de array

  if (error) {
    console.log(error);
    return null;
  }

  // Desestruturação dos relacionamentos
  const { collection_book = [], collection_serie = [], collection_wishlist = [], ...rest } = data;

  return {
    ...rest,
    books: collection_book.map((b: any) => ({
      value: b.book?.id?.toString() ?? "",
      label: b.book?.title ?? "",
      id: b.book_id,
      relationId: b.id,
    })),
    series: collection_serie.map((s: any) => ({
      value: s.serie?.id?.toString() ?? "",
      label: s.serie?.serie_name ?? "",
      id: s.serie_id,
      relationId: s.id,
    })),
    wishlist: collection_wishlist.map((w: any) => ({
      value: w.wishlist?.id?.toString() ?? "",
      label: w.wishlist?.book_name ?? "",
      id: w.wishlist_id,
      relationId: w.id,
    })),
  };
}

export async function getCollectionWithRelationsSlug(slug: string) {
  const { data, error } = await supabase
    .from("collection")
    .select(`
      *,
      collection_book(
        id,
        book_id,
        book:book_id(id, title, volume, rating, status, author, cover)
      ),
      collection_serie(
        id,
        serie_id,
        serie:serie_id(id, serie_name, qty_volumes, status, rating)
      ),
      collection_wishlist(
        id,
        wishlist_id,
        wishlist:wishlist_id(id, book_name, author)
      )
    `)
    .eq("slug", slug)
    .overrideTypes<CollectionWithRelations[]>()
    // .single();

  if (error) {
    console.log(error);
    return null;
  }
  
  if (data) {
    console.log(data);
  }

  return data
}
