"use server";

import { createClient } from "@/utils/supabase/server";
import { translateSupabaseError } from "@/utils/translateSupabaseError";

export async function uploadImage(file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(translateSupabaseError(error).message);
  return data.path;
}
