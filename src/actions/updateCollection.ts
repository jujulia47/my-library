import supabase from "@/utils/supabaseClient";

export default async function updateCollection(formData: FormData) {

  const id_collection = formData.get("id_collection");
  const collection_name = formData.get("collection_name") as string;
  const description = formData.get("description") as string;
  const init_date = formData.get("init_date") as string;
  const finish_date = formData.get("finish_date") as string;
  const book_ids = formData.getAll("book_id") as string[];
  const serie_ids = formData.getAll("serie_id") as string[];
  const wishlist_ids = formData.getAll("wishlist_id") as string[];

  // 1. Atualiza a coleção
  const { data, error } = await supabase
    .from("collection")
    .update({
      collection_name,
      description,
      init_date,
      finish_date,
    })
    .eq("id", id_collection)
    .select()
    .single();

    if (error) {
      console.log(error, "erro");
    }
    if (data) {
      console.log(data);
    }
  
  const collection_id: number | null | FormDataEntryValue = data.id;

  await supabase
    .from("collection_book")
    .delete()
    .eq("collection_id", collection_id);

  await supabase
    .from("collection_serie")
    .delete()
    .eq("collection_id", collection_id);

  await supabase
    .from("collection_wishlist")
    .delete()
    .eq("collection_id", collection_id);

  if (book_ids.length > 0) {
    const relations = book_ids.map((book_id) => ({
      collection_id: collection_id,
      book_id: Number(book_id),
    }));

    const { data: data_book_id, error } = await supabase
      .from("collection_book")
      .insert(relations)

    if (error) {
      console.log(error);
    }
    if (data_book_id) {
      console.log(data_book_id);
    } 
  }

  if (serie_ids.length > 0) {
    const relations = serie_ids.map((serie_id) => ({
      collection_id: collection_id,
      serie_id: Number(serie_id),
    }));

    const { data: data_serie_id, error } = await supabase
      .from("collection_serie")
      .insert(relations)

    if (error) {
      console.log(error);
    }
    if (data_serie_id) {
      console.log(data_serie_id);
    } 
  }

  if (wishlist_ids.length > 0) {
    const relations = wishlist_ids.map((wishlist_id) => ({
      collection_id: collection_id,
      wishlist_id: Number(wishlist_id),
    }));
    
    const { data: data_wishlist_id, error } = await supabase
      .from("collection_wishlist")
      .insert(relations)  
      
      //Com chaves é inserido um único objeto com chave relations, que não existe na tabela.
      // .insert({ relations });

    if (error) {
      console.log(error);
    }
    if (data_wishlist_id) {
      console.log(data_wishlist_id);
    } 
  }
}
