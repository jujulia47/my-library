"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export type UpdateBibliographyEntryParams = {
  id: string;
  title: string;
  publication_year?: number | null;
  notes?: string | null;
};

export async function updateBibliographyEntry(
  params: UpdateBibliographyEntryParams,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const title = params.title?.trim();
  if (!title)
    return { ok: false, message: "Título obrigatório.", field: "title" };

  let publication_year: number | null = null;
  if (
    params.publication_year !== null &&
    params.publication_year !== undefined
  ) {
    const n = Number(params.publication_year);
    if (!Number.isFinite(n) || n < 1 || n > 9999) {
      return {
        ok: false,
        message: "Ano de publicação inválido.",
        field: "publication_year",
      };
    }
    publication_year = Math.floor(n);
  }

  const notes = params.notes?.trim() || null;
  if (notes && notes.length > 500) {
    return {
      ok: false,
      message: "Notas excedem 500 caracteres.",
      field: "notes",
    };
  }

  // Captura slug do autor pra revalidatePath
  const { data: existing } = await supabase
    .from("author_bibliography")
    .select("author:author_id(slug)")
    .eq("id", params.id)
    .single();
  const slug = (existing as unknown as { author: { slug: string } | null } | null)
    ?.author?.slug;

  const { error } = await supabase
    .from("author_bibliography")
    .update({ title, publication_year, notes })
    .eq("id", params.id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (slug) revalidatePath(`/author/${slug}`);
  return { ok: true };
}
