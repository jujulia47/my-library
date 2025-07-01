import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type WishlistRead = Database["public"]["Tables"]["wishlist"]["Row"];
type WishlistUpdate = Database["public"]["Tables"]["wishlist"]["Update"];

export async function wishlistList() {
  const { data, error } = await supabase
    .from("wishlist")
    .select(`*, serie(id, serie_name)`)
    .overrideTypes<WishlistRead[]>();

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
    .overrideTypes<WishlistUpdate[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}