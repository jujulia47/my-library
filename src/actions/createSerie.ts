"use server";

import supabase from "@/utils/supabaseClient";

  export default async function createSerie(formData: FormData) {

    const serie_name = formData.get("serie_name") as string;
    const qty_volumes = formData.get("qty_volumes") as string;
    const collection_complete = formData.get("collection_complete") as string;
    const status = formData.get("status") as string;
    const init_date = (formData.get("init_date") as string) || null;
    const finish_date = (formData.get("finish_date") as string) || null;
    const rating = Number(formData.get("rating") || 0);
    const current_book_id = formData.get("current_book") as string;

    // salvar no Supabase...
    const { data, error } = await supabase
      .from("serie")
      .insert([
        {
          serie_name,
          qty_volumes,
          collection_complete,
          status,
          current_book_id,
          init_date,
          finish_date,
          rating,
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