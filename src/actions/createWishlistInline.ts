"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
} from "@/utils/translateSupabaseError";
import type { Database } from "@/utils/typings/supabase";

type WishlistPriority = Database["public"]["Enums"]["wishlist_priority"];

const ALLOWED_PRIORITIES: WishlistPriority[] = ["low", "medium", "high"];

function pickPriority(v: unknown): WishlistPriority | null {
  return typeof v === "string" &&
    ALLOWED_PRIORITIES.includes(v as WishlistPriority)
    ? (v as WishlistPriority)
    : null;
}

export type CreateWishlistInlineResult =
  | { ok: true; id: string; title: string; slug: string }
  | { ok: false; message: string; field?: string };

/**
 * Variante de createWishlist que **não redireciona** — retorna o id pra que o
 * caller possa encadear (ex: criar wishlist + adicionar a uma coleção). Usado
 * pelo AddCollectionItemModal na tab "Criar nova wishlist".
 */
export async function createWishlistInline(
  formData: FormData,
): Promise<CreateWishlistInlineResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const title = (formData.get("title") as string)?.trim();
  if (!title)
    return { ok: false, message: "Título obrigatório.", field: "title" };

  const author_name =
    (formData.get("author_name") as string)?.trim() || null;
  const purchase_link =
    (formData.get("purchase_link") as string)?.trim() || null;

  const priceRaw = (formData.get("estimated_price") as string) ?? "";
  let estimated_price: number | null = null;
  if (priceRaw.trim() !== "") {
    const n = Number(priceRaw.replace(",", "."));
    if (Number.isNaN(n) || n < 0) {
      return {
        ok: false,
        message: "Preço inválido.",
        field: "estimated_price",
      };
    }
    estimated_price = n;
  }

  const priority = pickPriority(formData.get("priority"));
  const notes = (formData.get("notes") as string)?.trim() || null;

  const slug =
    formateTitleToSlug(title) || crypto.randomUUID().slice(0, 8);

  const { data, error } = await supabase
    .from("wishlist")
    .insert({
      title,
      author_name,
      purchase_link,
      estimated_price,
      priority,
      notes,
      slug,
      user_id: user.id,
    })
    .select("id, slug, title")
    .single();
  if (error || !data) {
    const t = translateSupabaseError(error);
    return { ok: false, ...t };
  }

  revalidatePath("/wishlist");
  return { ok: true, id: data.id, title: data.title, slug: data.slug };
}
