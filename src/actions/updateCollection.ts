"use server";

import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import type { Database } from "@/utils/typings/supabase";

type CollectionType = Database["public"]["Enums"]["collection_type"];
type CollectionUpdate = Database["public"]["Tables"]["collection"]["Update"];

const VALID_TYPES: CollectionType[] = [
  "shelf",
  "list",
  "challenge",
  "subscription",
  "wishlist",
];

const BOOK_TYPES: CollectionType[] = [
  "shelf",
  "list",
  "challenge",
  "subscription",
];

function isIncompatibleSwitch(
  oldType: CollectionType,
  newType: CollectionType,
): boolean {
  // Wishlist coleção só aceita wishlist items; outras só aceitam books.
  // Trocar entre os dois mundos invalida items existentes.
  if (oldType === newType) return false;
  if (oldType === "wishlist" && BOOK_TYPES.includes(newType)) return true;
  if (BOOK_TYPES.includes(oldType) && newType === "wishlist") return true;
  return false;
}

function pickEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : null;
}

export default async function updateCollection(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = (formData.get("id") as string) || "";
  if (!id) return { ok: false, message: "Coleção inválida." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { ok: false, message: "Nome obrigatório.", field: "name" };

  const type = pickEnum(formData.get("type"), VALID_TYPES);
  if (!type)
    return { ok: false, message: "Tipo inválido.", field: "type" };

  const description =
    ((formData.get("description") as string) || "").trim() || null;
  const start_date = (formData.get("start_date") as string) || null;
  const end_date = (formData.get("end_date") as string) || null;

  const goalRaw = (formData.get("goal_count") as string) || "";
  let goal_count: number | null = null;
  if (goalRaw.trim() !== "") {
    const parsed = Number(goalRaw);
    if (!Number.isFinite(parsed) || parsed < 1)
      return {
        ok: false,
        message: "Meta deve ser um número maior que zero.",
        field: "goal_count",
      };
    goal_count = Math.floor(parsed);
  }

  const provider =
    ((formData.get("provider") as string) || "").trim() || null;

  if (type === "challenge") {
    if (!goal_count)
      return {
        ok: false,
        message: "Meta de livros obrigatória para desafios.",
        field: "goal_count",
      };
    if (!start_date)
      return {
        ok: false,
        message: "Data de início obrigatória para desafios.",
        field: "start_date",
      };
    if (!end_date)
      return {
        ok: false,
        message: "Data de fim obrigatória para desafios.",
        field: "end_date",
      };
  }

  if (type === "subscription") {
    if (!provider)
      return {
        ok: false,
        message: "Provedor obrigatório para assinaturas.",
        field: "provider",
      };
    if (!start_date)
      return {
        ok: false,
        message: "Data de início obrigatória para assinaturas.",
        field: "start_date",
      };
  }

  // Detecta troca incompatível de tipo (wishlist ↔ outros) e exige a flag
  // `clear_items` (autorização explícita do usuário no dialog do front).
  // Sem a flag, retorna erro pra que o dialog pegue. Com a flag, deleta os
  // items antes de atualizar o tipo. RLS já confina ao user dono da coleção.
  const { data: existing, error: fetchErr } = await supabase
    .from("collection")
    .select("type")
    .eq("id", id)
    .single();
  if (fetchErr || !existing)
    return { ok: false, message: "Coleção não encontrada." };

  if (isIncompatibleSwitch(existing.type, type)) {
    const clearFlag =
      ((formData.get("clear_items") as string) || "").toLowerCase() ===
      "true";
    if (!clearFlag) {
      return {
        ok: false,
        message:
          "Trocar pra esse tipo invalida os items atuais. Confirme no dialog pra removê-los.",
        code: "incompatible_type_switch",
      };
    }
    const { error: delErr } = await supabase
      .from("collection_item")
      .delete()
      .eq("collection_id", id);
    if (delErr) return { ok: false, ...translateSupabaseError(delErr) };
  }

  const newSlug = formateTitleToSlug(name);

  const isFavoriteRaw = (formData.get("is_favorite") as string) || "";
  const is_favorite = isFavoriteRaw === "true";

  const payload: CollectionUpdate = {
    name,
    slug: newSlug,
    type,
    description,
    start_date: type === "shelf" ? null : start_date,
    end_date: type === "subscription" || type === "shelf" ? null : end_date,
    goal_count: type === "challenge" ? goal_count : null,
    provider: type === "subscription" ? provider : null,
    is_favorite,
  };

  const { error } = await supabase
    .from("collection")
    .update(payload)
    .eq("id", id);

  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/collection");
  revalidatePath(`/collection/${newSlug}`);
  redirect(`/collection/${newSlug}`);
}
