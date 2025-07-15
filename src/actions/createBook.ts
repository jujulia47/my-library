"use server";

import supabase from "@/utils/supabaseClient";
// import { Book } from "@/utils/typings";
import { Database } from "@/utils/typings/supabase";

type Book = Database["public"]["Tables"]["book"]["Row"];

export default async function createBook(formData: FormData) {
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const author = formData.get("author") as string;
  const cover = formData.get("cover") as string;
  const single_book_value = formData.get("single_book");
  const single_book = single_book_value === "true" ? true : false;
  const serie_id = formData.get("serie_id");
  //pegar o valor do input no formulário
  const serie_name = formData.get("serie_name");
  const volume = Number(formData.get("volume") || 0);
  const category = formData.get("category") as string;
  const pages = Number(formData.get("pages") || 0);
  const language = formData.get("language") as string;
  const library_value = formData.get("library");
  const library = library_value === "true" ? true : false;
  const acquisition_date = (formData.get("acquisition_date") as string) || null;
  const status = formData.get("status") as string;
  const init_date = (formData.get("init_date") as string) || null;
  const finish_date = (formData.get("finish_date") as string) || null;
  const current_page = Number(formData.get("current_page") || 0);
  const rating = Number(formData.get("rating") || 0);
  const physical = formData.get("physical") as string;
  const audiobook = formData.get("audiobook") as string;
  const ebook = formData.get("ebook") as string;
  const comments = formData.get("comments") as string;
  const quote = formData.get("quote") as string
  const quote_page = Number(formData.get("quote_page") || null)

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
    .from("book")
    .insert([
      {
        title,
        slug,
        author,
        cover,
        is_single_book: single_book,
        serie_id: serieId,
        volume,
        category,
        pages,
        language,
        library,
        acquisition_date,
        status,
        init_date,
        finish_date,
        current_page,
        rating,
        version: [physical, audiobook, ebook],
        comments,
      },
    ])
    .select()
    .single<Book>()
    // .overrideTypes<Book[]>();

  if (error) {
    console.log(error, "erro");
  }
  if (data) {
    console.log(data);
  }

  if(quote){
    // Agora cadastra as citações associadas a esse livro
    const { data: quotes, error: quoteError } = await supabase
      .from("quote")
      .insert([{quote, page: quote_page, book_id: data?.id}]);
  
    if (quoteError) {
      console.log(quoteError);
    }
    if(quotes) {
      console.log(quotes);
    }
  }
}
