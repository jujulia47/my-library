"use server";

import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import { revalidatePath } from "next/cache";

/**
 * "Marcar como adquirido" inteligente. Antes de mandar o usuário pro fluxo
 * de criar livro novo, checa se já existe um livro cadastrado com o mesmo
 * título (slug determinístico via `formateTitleToSlug` — mesma função usada
 * em `createBookMinimal` e `createCategory`, então slugs batem).
 *
 * Cenário motivador: usuário lê um livro emprestado/biblioteca, cadastra o
 * livro pra registrar a leitura (ownership_status = "returned"/"borrowed"),
 * tempo depois adiciona ele à wishlist pra comprar, e marca como adquirido.
 * Sem este match, o app tentaria criar um livro duplicado (e quebraria na
 * unique constraint `book_user_slug_key`).
 *
 * - Match encontrado: migra `collection_item`s da wishlist pro book existente
 *   (preservando `was_wishlist=true`), apaga a wishlist e retorna o slug do
 *   book pra o client redirecionar pra `/book/edit/<id>` — usuário ajusta
 *   posse e datas.
 * - Sem match: retorna `match: null` pra o client cair no fluxo padrão
 *   (`/book/new?from_wishlist=<id>`).
 *
 * RLS garante que toda query só toca dados do próprio usuário.
 */
export type MarkAcquiredResult =
  | { ok: false; message: string }
  | { ok: true; match: { bookId: string; bookSlug: string; title: string } | null };

export async function markWishlistAcquired(
  wishlistId: string,
): Promise<MarkAcquiredResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: wishlist, error: wlError } = await supabase
    .from("wishlist")
    .select("id, title")
    .eq("id", wishlistId)
    .maybeSingle();

  if (wlError) return { ok: false, message: wlError.message };
  if (!wishlist) return { ok: false, message: "Wishlist não encontrada." };

  // Slug determinístico: usar a mesma função do create garante que
  // "Vinte mil léguas" tanto no wishlist quanto no book existente resolvem
  // pro mesmo "vinte-mil-leguas".
  const candidateSlug = formateTitleToSlug(wishlist.title);

  const { data: existingBook } = await supabase
    .from("book")
    .select("id, slug, title")
    .eq("slug", candidateSlug)
    .maybeSingle();

  if (!existingBook) {
    return { ok: true, match: null };
  }

  // Match: migra collection_items que apontavam pra wishlist e remove a
  // wishlist. Mesma ordem usada no `createBookMinimal` — migrar ANTES de
  // deletar a wishlist por causa do `on delete cascade` em collection_item.
  await supabase
    .from("collection_item")
    .update({
      book_id: existingBook.id,
      wishlist_id: null,
      was_wishlist: true,
    })
    .eq("wishlist_id", wishlistId);

  await supabase.from("wishlist").delete().eq("id", wishlistId);

  revalidatePath("/wishlist");
  revalidatePath("/collection");
  revalidatePath(`/book/${existingBook.slug}`);

  return {
    ok: true,
    match: {
      bookId: existingBook.id,
      bookSlug: existingBook.slug,
      title: existingBook.title,
    },
  };
}
