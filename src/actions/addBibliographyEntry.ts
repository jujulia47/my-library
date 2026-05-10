"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export type AddBibliographyEntryParams = {
  author_id: string;
  title: string;
  publication_year?: number | null;
  notes?: string | null;
};

export async function addBibliographyEntry(
  params: AddBibliographyEntryParams,
): Promise<ActionResult<{ id: string }>> {
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

  // Confirma ownership do autor
  const { data: author } = await supabase
    .from("author")
    .select("id, slug")
    .eq("id", params.author_id)
    .single();
  if (!author) return { ok: false, message: "Autor não encontrado." };

  const { data, error } = await supabase
    .from("author_bibliography")
    .insert({
      author_id: params.author_id,
      title,
      publication_year,
      notes,
      user_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath(`/author/${author.slug}`);
  return { ok: true, data: { id: data.id } };
}
