"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Atribui um livro órfão (shelf_id null) a uma estante. Usado pelo picker
 * em /library/shelf/[id]/add quando user clica num livro da lista. Vai pro
 * fim da estante (max+1).
 */
export async function assignBookToShelf(params: {
  bookId: string;
  shelfId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: book } = await supabase
    .from("book")
    .select("id, slug")
    .eq("id", params.bookId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!book) return { ok: false, message: "Livro não encontrado." };

  const { data: shelf } = await supabase
    .from("shelf")
    .select("id")
    .eq("id", params.shelfId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!shelf) return { ok: false, message: "Estante não encontrada." };

  const { data: maxRow } = await supabase
    .from("book")
    .select("shelf_position")
    .eq("shelf_id", params.shelfId)
    .order("shelf_position", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (maxRow?.shelf_position ?? -1) + 1;

  const { error } = await supabase
    .from("book")
    .update({
      shelf_id: params.shelfId,
      shelf_position: nextPosition,
    })
    .eq("id", params.bookId);

  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/library");
  revalidatePath(`/library/shelf/${params.shelfId}`);
  revalidatePath(`/book/${book.slug}`);
  return { ok: true };
}
