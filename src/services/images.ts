import supabase from "@/utils/supabaseClient";

export async function imagesUrl(path: string) {
  const { data } = supabase
    .storage
    .from("images")
    .getPublicUrl(path);


  if (data) {
    console.log(data);
    return data.publicUrl;
  }

  return data
}