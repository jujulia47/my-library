"use server";

import supabase from "../utils/supabaseClient";

export default async function updateWishlist(formData: FormData) {
  
  const id = formData.get("id");
  const book_name = formData.get("book_name") as string;
  const author = formData.get("author") as string;
  const single_book_value = formData.get("single_book");
  const single_book = single_book_value === "true" ? true : false;
  const serie_id = formData.get("serie_id");
  const volume = Number(formData.get("volume") || 0);

  const { data, error } = await supabase
    .from("wishlist")
    .update([
      {
        book_name,
        author,
        is_single_book: single_book,
        serie_id,
        volume,
      },
    ])
    .eq("id", id)
    .select();

  if (error) {
    console.log(error, "erro");
  }
  if (data) {
    console.log(data);
  }
}
