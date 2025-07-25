import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type CollectionUpdate = Database["public"]["Tables"]["collection"]["Update"];
type CollectionRead = Database["public"]["Tables"]["collection"]["Row"];
type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];
type Wishlist = Database["public"]["Tables"]["wishlist"]["Row"];

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
  wishlist: {
    id: number;
    created_at: string;
    book_id: number;
    book: Book | null;
  } | null;
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
      wishlist(
        id,
        book_id,
        book:book_id(id, title)
      )
    )
    `)
    .eq("id", id)
    .overrideTypes<CollectionWithRelations[]>()

  if (error) {
    console.log(error);
    return null;
  }

  const books = data?.[0]?.collection_book.map((item) => item.book) ?? [];
  const series = data?.[0]?.collection_serie.map((item) => item.serie) ?? [];
  const wishlist = data?.[0]?.collection_wishlist.map((item) => item.wishlist) ?? [];
  const wishlistBooks = wishlist.map((item) => item?.book).filter(Boolean) ?? [];
  
  return {
    books: books.map((book) => ({
      id: book?.id ?? 0,
      label: book?.title ?? "",
      value: book?.id?.toString() ?? "",
      relationId: book?.id ?? 0, // ou usar o id do relacionamento se quiser
    })),
    series: series.map((serie) => ({
      id: serie?.id ?? 0,
      label: serie?.serie_name ?? "",
      value: serie?.id?.toString() ?? "",
      relationId: serie?.id ?? 0,
    })),
    wishlist: wishlist.map((wishlistBook) => ({
      id: wishlistBook?.id ?? 0,
      label: wishlistBook?.book?.title ?? "",
      value: wishlistBook?.id?.toString() ?? "",
      relationId: wishlistBook?.book?.id ?? 0,
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
      wishlist(
        id,
        book_id,
        book:book_id(*)
      )
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
