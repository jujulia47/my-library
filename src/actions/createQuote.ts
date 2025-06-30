"use server";

import supabase from "@/utils/supabaseClient";

  export default async function createQuote(formData: FormData) {

    const quote = formData.get("quote") as string;
    const page = formData.get("page") as string;
    const book_id = formData.get("book_id") as string;

    // salvar no Supabase...
    const { data, error } = await supabase
      .from("quote")
      .insert([
        {
          quote,
          page,
          book_id,
        },
      ])
      .select();

    if (error) {
      console.log(error, "erro");
    }
    if (data) {
      console.log(data);
    }
  }