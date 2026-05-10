"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export async function deleteAuthor(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  // Busca foto pra remover do storage; book_author cascateia via FK.
  const { data: author } = await supabase
    .from("author")
    .select("photo_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("author").delete().eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (author?.photo_url) {
    await supabase.storage.from("author-photos").remove([author.photo_url]);
  }

  revalidatePath("/author/[slug]", "page");
  return { ok: true };
}
