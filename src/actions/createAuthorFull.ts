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

type Country = Database["public"]["Enums"]["country"];
type AuthorInsert = Database["public"]["Tables"]["author"]["Insert"];

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

function pickYear(raw: string | null): { ok: true; value: number | null } | { ok: false; field: string; message: string } {
  if (!raw || raw.trim() === "") return { ok: true, value: null };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 9999) {
    return {
      ok: false,
      field: "",
      message: "Ano inválido (precisa estar entre 1 e 9999).",
    };
  }
  return { ok: true, value: Math.floor(n) };
}

/**
 * Variante "full" do createAuthor: aceita FormData com todos os campos
 * (nome, foto, país, datas, bio). Em sucesso, redireciona pro detail
 * via slug. Em erro, retorna ActionResult com `field` quando aplicável.
 *
 * Distinto de `createAuthor(name)` que continua existindo pra criação
 * inline durante cadastro de livro (AuthorMultiSelect).
 */
export async function createAuthorFull(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

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

  // Foto: upload no bucket author-photos com path {user_id}/{uuid}.{ext}
  const photo = formData.get("photo") as File | null;
  let photo_url: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { data: up, error: upErr } = await supabase.storage
      .from("author-photos")
      .upload(path, photo, { cacheControl: "3600", upsert: false });
    if (upErr) return { ok: false, ...translateSupabaseError(upErr) };
    photo_url = up?.path ?? null;
  }

  const slug = formateTitleToSlug(name);
  const payload: AuthorInsert = {
    name,
    slug,
    country,
    birth_year,
    death_year,
    bio,
    photo_url,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("author")
    .insert(payload)
    .select("slug")
    .single();
  if (error || !data) {
    // Cleanup foto órfã se insert falhou após upload
    if (photo_url) {
      await supabase.storage.from("author-photos").remove([photo_url]);
    }
    return { ok: false, ...translateSupabaseError(error) };
  }

  revalidatePath("/author/[slug]", "page");
  redirect(`/author/${data.slug}`);
}
