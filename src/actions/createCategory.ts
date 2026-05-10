"use server";

import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export async function createCategory(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { ok: false, message: "Nome obrigatório." };

  const slug = formateTitleToSlug(name);

  const { error } = await supabase.from("category").insert({
    name,
    slug,
    user_id: user.id,
  });

  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/category");
  return { ok: true };
}
