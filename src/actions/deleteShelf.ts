"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Deleta uma estante VAZIA. Se a estante tiver pelo menos 1 livro, retorna
 * erro — o user precisa primeiro mover/excluir os livros. Isso evita perda
 * acidental de livros via cascade.
 */
export async function deleteShelf(
  shelfId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: shelf } = await supabase
    .from("shelf")
    .select("id")
    .eq("id", shelfId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!shelf) return { ok: false, message: "Estante não encontrada." };

  const { count } = await supabase
    .from("book")
    .select("id", { count: "exact", head: true })
    .eq("shelf_id", shelfId)
    .eq("user_id", user.id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message:
        "Estante tem livros — mova-os pra outra estante antes de excluir.",
    };
  }

  const { error } = await supabase
    .from("shelf")
    .delete()
    .eq("id", shelfId)
    .eq("user_id", user.id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/library");
  return { ok: true };
}
