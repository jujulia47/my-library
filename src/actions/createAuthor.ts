"use server";

import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import { translateSupabaseError } from "@/utils/translateSupabaseError";

export type CreateAuthorResult =
  | { ok: true; id: string; name: string }
  | { ok: false; message: string };

export async function createAuthor(rawName: string): Promise<CreateAuthorResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const name = rawName?.trim();
  if (!name) return { ok: false, message: "Nome obrigatório." };

  const { data: existing } = await supabase
    .from("author")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("name", name)
    .maybeSingle();

  if (existing) return { ok: true, id: existing.id, name: existing.name };

  const slug = formateTitleToSlug(name);
  const { data, error } = await supabase
    .from("author")
    .insert({ name, slug, user_id: user.id })
    .select("id, name")
    .single();

  if (error || !data) {
    return { ok: false, message: translateSupabaseError(error ?? null).message };
  }
  return { ok: true, id: data.id, name: data.name };
}
