"use server";

import supabase from "@/utils/supabaseClient";

export default async function updateQuote(formData: FormData) {

  const id = formData.get("id");
  const quote = formData.get("quote") as string;
  const page = formData.get("page") as string;
  const book_id = formData.get("book_id") as string;

  const { data, error } = await supabase
    .from("quote")
    .update([
      {
        quote,
        page,
        book_id,
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