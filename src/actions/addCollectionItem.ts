"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { maybeCompleteChallenges } from "@/services/challengeCompletion";

export type AddCollectionItemParams = {
  collection_id: string;
  book_id?: string | null;
  wishlist_id?: string | null;
  section?: string | null;
  /**
   * Marcador histórico — true quando o item está sendo migrado de wishlist
   * pra book (fluxo "marcar como adquirido"). Permite book_id em coleção
   * tipo wishlist como exceção.
   */
  was_wishlist?: boolean;
};

export async function addCollectionItem(
  params: AddCollectionItemParams,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { collection_id } = params;
  if (!collection_id) return { ok: false, message: "Coleção inválida." };

  const book_id = params.book_id || null;
  const wishlist_id = params.wishlist_id || null;
  const wasWishlist = params.was_wishlist === true;

  // XOR: exatamente um dos dois.
  if ((book_id && wishlist_id) || (!book_id && !wishlist_id)) {
    return {
      ok: false,
      message: "Item inválido — deve ser um livro OU um item de wishlist.",
    };
  }

  const section = (params.section ?? "").trim() || null;

  // Confirma ownership + lê tipo da coleção (defesa em profundidade — RLS
  // já bloqueia o cross-user, mas validamos o casamento de tipo aqui).
  const { data: collection, error: collErr } = await supabase
    .from("collection")
    .select("id, slug, type")
    .eq("id", collection_id)
    .single();
  if (collErr || !collection)
    return { ok: false, message: "Coleção não encontrada." };

  // Validação por tipo:
  //  - coleção wishlist exige wishlist_id (exceto when was_wishlist=true,
  //    fluxo "marcar como adquirido" preserva o vínculo histórico)
  //  - coleção dos outros tipos (book-only) exige book_id
  if (collection.type === "wishlist") {
    if (book_id && !wasWishlist) {
      return {
        ok: false,
        message: "Esse tipo de item não pode ser adicionado a essa coleção.",
        code: "wrong_item_type",
      };
    }
  } else {
    if (wishlist_id) {
      return {
        ok: false,
        message: "Esse tipo de item não pode ser adicionado a essa coleção.",
        code: "wrong_item_type",
      };
    }
  }

  const { error } = await supabase.from("collection_item").insert({
    collection_id,
    book_id,
    wishlist_id,
    section,
    was_wishlist: wasWishlist,
    user_id: user.id,
  });
  if (error) return { ok: false, ...translateSupabaseError(error) };

  // Sessão 15.1: se for challenge e o item adicionado tem reading finished,
  // pode ter completado a meta agora. Falha silenciosa — não bloqueia insert.
  if (collection.type === "challenge" && book_id) {
    await maybeCompleteChallenges(supabase, user.id, [collection_id]);
  }

  revalidatePath(`/collection/${collection.slug}`);
  revalidatePath("/collection");
  return { ok: true };
}
