'use server'

import supabase from "@/utils/supabaseClient";

export async function uploadImage(file: File) {
  const { data, error } = await supabase
  .storage
  .from("images")
  .upload(file.name, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if(error){
    console.log(error);
    throw new Error(error.message);
  }
  if(data){
    console.log(data);
    return data.path;
  }
}
