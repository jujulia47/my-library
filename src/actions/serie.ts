"use server";

import supabase from "@/utils/supabaseClient";

  export default async function createSerie(formData: FormData) {

    const serie_name = formData.get("serie_name") as string;
    const qty_volumes = formData.get("qty_volumes") as string;
    const library_colection = formData.get("library_colection") as string;
    const status = formData.get("status") as string;
    const init_date = (formData.get("init_date") as string) || null;
    const finish_date = (formData.get("finish_date") as string) || null;
    const rating = Number(formData.get("rating") || 0);

    // console.log("serie_name", serie_name, typeof serie_name);
    // console.log("qty_volumes", qty_volumes, typeof qty_volumes);
    // console.log("library_colection", library_colection, typeof library_colection);
    // console.log("status", status, typeof status);
    // console.log("init_date", init_date , typeof init_date );
    // console.log("finish_date", finish_date, typeof finish_date);
    // console.log("rating", rating, typeof rating);

    // salvar no Supabase...
    const { data, error } = await supabase
      .from("book")
      .insert([
        {
          serie_name,
          qty_volumes,
          library_colection,
          status,
          init_date,
          finish_date,
          rating
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