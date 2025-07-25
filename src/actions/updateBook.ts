import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";
type Book = Database["public"]["Tables"]["book"]["Row"];

export default async function updateBook(formData: FormData) {
  const id = formData.get("id");
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const author = formData.get("author") as string;
  const cover = formData.get("cover") as File;
  const single_book_value = formData.get("single_book");
  const single_book = single_book_value === "true" ? true : false;
  const serie_id = formData.get("serie_id");
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
  const rereaded = formData.get("rereaded") as string;

  let coverPath: string | null = null;

  if (cover) {
    const { data: coverData, error } = await supabase
      .storage
      .from("images")
      .upload(cover.name, cover, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.log(error);
    }
    if (coverData) {
      console.log(coverData);
      coverPath = coverData.path;
    }
  }

  const { data, error } = await supabase
    .from("book")
    .update([
      {
        title,
        slug,
        author,
        cover: coverPath,
        is_single_book: single_book,
        serie_id,
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
        rereaded
      },
    ])
    .eq("id", id)
    .select()
    .single<Book>();

  if (error) {
    console.log(error);
  }

  if (data) {
    console.log(data);
  }
}
