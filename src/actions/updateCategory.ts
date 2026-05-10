"use server";

import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export async function updateCategory(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id || !name) return { ok: false, message: "Dados inválidos." };

  // Slug acompanha o nome: regerado a cada update. Colisão dispara unique
  // constraint, traduzida via translateSupabaseError pra erro inline em `name`.
  const newSlug = formateTitleToSlug(name);

  const { error } = await supabase
    .from("category")
    .update({ name, slug: newSlug })
    .eq("id", id);

  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/category");
  return { ok: true };
}
