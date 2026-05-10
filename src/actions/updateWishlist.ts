"use server";

import { redirect } from "next/navigation";
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

export default async function updateWishlist(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "ID ausente." };

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

  // Slug acompanha o título (regerado a cada update — sessão 6.4).
  const newSlug =
    formateTitleToSlug(title) || crypto.randomUUID().slice(0, 8);

  const { error } = await supabase
    .from("wishlist")
    .update({
      title,
      slug: newSlug,
      author_name,
      purchase_link,
      estimated_price,
      priority,
      notes,
    })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/wishlist");
  revalidatePath(`/wishlist/${newSlug}`);

  // Em sucesso: se veio com ?from= seguro, volta pra origem. Mas se `from`
  // aponta pra detail page deste mesmo item (`/wishlist/{algumSlug}`), o slug
  // antigo já não existe — força redirect pro slug novo, evitando 404
  // (mesma lógica do livro/série, sessão 7).
  const rawFrom = formData.get("from");
  if (
    typeof rawFrom === "string" &&
    rawFrom.startsWith("/") &&
    !rawFrom.startsWith("//")
  ) {
    if (rawFrom.startsWith("/wishlist/") && rawFrom !== "/wishlist") {
      redirect(`/wishlist/${newSlug}`);
    }
    redirect(rawFrom);
  }
  redirect(`/wishlist/${newSlug}`);
}
