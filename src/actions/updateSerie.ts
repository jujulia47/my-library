"use server";

import supabase from "@/utils/supabaseClient";

  export default async function updateSerie(formData: FormData) {

    const id = formData.get("id");
    const serie_name = formData.get("serie_name") as string;
    const slug = formData.get("slug") as string;
    const qty_volumes = formData.get("qty_volumes") as string;
    const collection_complete = formData.get("collection_complete") as string;
    const status = formData.get("status") as string;
    const init_date = (formData.get("init_date") as string);
    const finish_date = (formData.get("finish_date") as string);
    const rating = Number(formData.get("rating") || 0);
    const current_book_id = formData.get("current_book") as string;

    const { data, error } = await supabase
      .from("serie")
      .update([
        {
          serie_name,
          slug,
          qty_volumes,
          collection_complete,
          status,
          current_book_id,
          init_date,
          finish_date,
          rating,
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