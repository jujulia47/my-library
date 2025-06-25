import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type WishlistRead = Database["public"]["Tables"]["wishlist"]["Row"];

export async function wishlistList() {
  const { data, error } = await supabase
    .from("wishlist")
    .select()
    .overrideTypes<WishlistRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}
  