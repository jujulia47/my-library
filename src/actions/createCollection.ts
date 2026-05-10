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
type CollectionInsert = Database["public"]["Tables"]["collection"]["Insert"];

const VALID_TYPES: CollectionType[] = [
  "shelf",
  "list",
  "challenge",
  "subscription",
  "wishlist",
];

function pickEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : null;
}

export default async function createCollection(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

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

  // Validações específicas por tipo.
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

  const slug = formateTitleToSlug(name);

  // Limpa campos não-aplicáveis pro tipo escolhido.
  // shelf/subscription não tem end_date; goal_count só challenge; provider só
  // subscription. start_date é livre exceto em shelf (que zera).
  const payload: CollectionInsert = {
    name,
    slug,
    type,
    description,
    start_date: type === "shelf" ? null : start_date,
    end_date: type === "subscription" || type === "shelf" ? null : end_date,
    goal_count: type === "challenge" ? goal_count : null,
    provider: type === "subscription" ? provider : null,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("collection")
    .insert(payload)
    .select("slug")
    .single();

  if (error || !data) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/collection");
  redirect(`/collection/${data.slug}`);
}
