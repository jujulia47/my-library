"use server";

import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import type { Database } from "@/utils/typings/supabase";

type Country = Database["public"]["Enums"]["country"];
type AuthorUpdate = Database["public"]["Tables"]["author"]["Update"];

const VALID_COUNTRIES: Country[] = [
  "africa_do_sul", "alemanha", "angola", "argentina", "australia",
  "brasil", "cabo_verde", "canada", "chile", "china",
  "colombia", "coreia_do_sul", "cuba", "egito", "espanha",
  "estados_unidos", "franca", "holanda", "hungria", "india",
  "irlanda", "israel", "italia", "japao", "mexico",
  "mocambique", "noruega", "peru", "polonia", "portugal",
  "reino_unido", "republica_tcheca", "russia", "suecia", "turquia",
];

function pickCountry(value: unknown): Country | null {
  return typeof value === "string" && VALID_COUNTRIES.includes(value as Country)
    ? (value as Country)
    : null;
}

function pickYear(raw: string | null): { ok: true; value: number | null } | { ok: false; message: string } {
  if (!raw || raw.trim() === "") return { ok: true, value: null };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 9999) {
    return { ok: false, message: "Ano inválido (precisa estar entre 1 e 9999)." };
  }
  return { ok: true, value: Math.floor(n) };
}

export async function updateAuthor(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = (formData.get("id") as string) || "";
  if (!id) return { ok: false, message: "Autor inválido." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { ok: false, message: "Nome obrigatório.", field: "name" };

  const country = pickCountry(formData.get("country"));

  const birthRes = pickYear((formData.get("birth_year") as string) || null);
  if (!birthRes.ok)
    return { ok: false, message: birthRes.message, field: "birth_year" };
  const death = pickYear((formData.get("death_year") as string) || null);
  if (!death.ok)
    return { ok: false, message: death.message, field: "death_year" };
  const birth_year = birthRes.value;
  const death_year = death.value;

  if (birth_year !== null && death_year !== null && birth_year > death_year) {
    return {
      ok: false,
      message: "Ano de nascimento deve ser anterior ao ano de morte.",
      field: "death_year",
    };
  }

  const bio = ((formData.get("bio") as string) || "").trim() || null;
  if (bio !== null && bio.length > 5000) {
    return { ok: false, message: "Bio excede 5000 caracteres.", field: "bio" };
  }

  // Carrega autor atual pra detectar troca de foto e regerar slug se nome mudou.
  const { data: existing, error: fetchErr } = await supabase
    .from("author")
    .select("id, slug, photo_url")
    .eq("id", id)
    .single();
  if (fetchErr || !existing)
    return { ok: false, message: "Autor não encontrado." };

  // Foto: 3 cenários
  //  1. Nova foto enviada → upload + remover antiga (se houver)
  //  2. photo_removed=true → remover antiga, photo_url=null
  //  3. Nada → mantém atual
  const photo = formData.get("photo") as File | null;
  const photoRemoved =
    ((formData.get("photo_removed") as string) || "") === "true";

  let photo_url: string | null | undefined = undefined; // undefined = não tocar
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { data: up, error: upErr } = await supabase.storage
      .from("author-photos")
      .upload(path, photo, { cacheControl: "3600", upsert: false });
    if (upErr) return { ok: false, ...translateSupabaseError(upErr) };
    photo_url = up?.path ?? null;
  } else if (photoRemoved) {
    photo_url = null;
  }

  const oldSlug = existing.slug;
  const newSlug = formateTitleToSlug(name);

  const payload: AuthorUpdate = {
    name,
    slug: newSlug,
    country,
    birth_year,
    death_year,
    bio,
  };
  if (photo_url !== undefined) payload.photo_url = photo_url;

  const { error } = await supabase
    .from("author")
    .update(payload)
    .eq("id", id);
  if (error) {
    // Rollback de foto recém-uploadada (se aplicável) pra evitar órfã
    if (photo_url && photo_url !== existing.photo_url) {
      await supabase.storage.from("author-photos").remove([photo_url]);
    }
    return { ok: false, ...translateSupabaseError(error) };
  }

  // Foto trocada com sucesso → remover a anterior do storage
  if (
    existing.photo_url &&
    photo_url !== undefined &&
    photo_url !== existing.photo_url
  ) {
    await supabase.storage.from("author-photos").remove([existing.photo_url]);
  }

  revalidatePath("/author/[slug]", "page");
  if (oldSlug !== newSlug) revalidatePath(`/author/${oldSlug}`);
  return { ok: true, data: { redirectTo: `/author/${newSlug}` } };
}
