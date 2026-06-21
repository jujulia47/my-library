"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
  type ActionResult,
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

export default async function createWishlist(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
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
  // Data de lançamento (opcional) — formato YYYY-MM-DD do <input type="date">.
  // Datas no passado também são aceitas (caso o user marque um livro já
  // lançado mas queira manter o registro). Vazio = null.
  const release_date =
    (formData.get("release_date") as string)?.trim() || null;

  // Slug direto via title; fallback pra UUID curto se title vira slug vazio
  // (ex: título só com símbolos). Política da sessão 6.4.
  const slug =
    formateTitleToSlug(title) || crypto.randomUUID().slice(0, 8);

  const { error } = await supabase.from("wishlist").insert({
    title,
    author_name,
    purchase_link,
    estimated_price,
    priority,
    notes,
    release_date,
    slug,
    user_id: user.id,
  });
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/wishlist");
  return { ok: true, data: { redirectTo: `/wishlist/${slug}` } };
}
