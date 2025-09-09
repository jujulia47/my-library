import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type WishlistRead = Database["public"]["Tables"]["wishlist"]["Row"];
type WishlistUpdate = Database["public"]["Tables"]["wishlist"]["Update"];


type collection = Database["public"]["Tables"]["collection"]["Row"];
type book = Database["public"]["Tables"]["book"]["Row"];
type collectionWishlist = Database["public"]["Tables"]["collection_wishlist"]["Row"];

type WishlistWithRelations = WishlistRead & {
  book: book;
}

type collectionWithRelations = collectionWishlist & {
  collection: collection;
  wishlist: {
    id: number;
    book_id: number;
    book: book;
  };
};

export async function wishlistList() {
  const { data, error } = await supabase
    .from("wishlist")
    .select(`*, book(*)`)
    .overrideTypes<WishlistWithRelations[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

export async function wishlistById(id: number) {
  
  const { data, error } = await supabase
    .from("wishlist")
    .select()
    .eq("id", id)
    .overrideTypes<WishlistWithRelations[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

export async function wishlistWithRelations() {
  const { data, error } = await supabase
    .from("collection_wishlist")
    .select(`*, collection:collection_id(id, collection_name), wishlist:wishlist_id(id, book_id, book:book_id(*))`)

    .overrideTypes<collectionWithRelations[]>()
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

export async function wishlistByBookId(bookId: number) {
  const { data, error } = await supabase
    .from("wishlist")
    .select(`*, book(id, title)`)
    .eq("book_id", bookId)
    .overrideTypes<WishlistRead[]>();

  if (error) {
    console.error("Erro ao buscar Wishlist por ID do livro:", error);
    return [];
  }

  return data ?? [];
}