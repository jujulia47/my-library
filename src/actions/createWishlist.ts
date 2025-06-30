"use server";

import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type Wishlist = Database["public"]["Tables"]["wishlist"]["Row"];

export default async function createWishlist(formData: FormData) {
  const book_name = formData.get("book_name") as string;
  const author = formData.get("author") as string;
  const single_book_value = formData.get("single_book");
  const single_book = single_book_value === "true" ? true : false;
  const serie_id = formData.get("serie_id");
  //pegar o valor do input no formulário
  const serie_name = formData.get("serie_name");
  const volume = Number(formData.get("volume") || 0);

  let serieId: number | null | FormDataEntryValue  = serie_id;

  //Se o campo do input tem algum valor
  if (serie_name) {
    //busca na tabela série se o valor do input bate com o valor da coluna "serie_name"
    //E selecionamos o ID dessa linha
    const { data: serieData, error } = await supabase
      .from("serie")
      .select("id")
      .eq("serie_name", serie_name)
      .single();

    if (error) {
      console.log(error);
    }
    if (serieData) {
      //se temos um Data da série digitada, pegamos o ID e passamos para a variável que vai receber o ID que a coluna serie_id em book vai receber como valor
      // serieId
      return
    } else {
      //Se não temos esse data então damos um insert na tabela série com o valor inserido no input
      const { data: newSerieData, error } = await supabase
        .from("serie")
        .insert({ serie_name })
        .select()
        //single porque senão viria um array (supabase sempre retorna um array) e temos certeza que só estamos cadastrando uma série.
        // Esse single transforma o array em um objeto único
        .single();

      if (error) {
        console.log(error);
      }
      //Se conseguimos dar o insert, serieId recebe o ID da nova série cadastrada
      if (newSerieData) {
        console.log(newSerieData);
        serieId = newSerieData.id;
      }
    }
  }

  // salvar no Supabase...
  const { data, error } = await supabase
    .from("wishlist")
    .insert([
      {
        book_name,
        author,
        is_single_book: single_book,
        serie_id: serieId,
        volume,
      },
    ])
    .select()
    .single<Wishlist>()

  if (error) {
    console.log(error, "erro");
  }
  if (data) {
    console.log(data);
  }
}
