"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Vincula um livro existente (sem série) à série indicada. Validações:
 * - Livro pertence ao usuário e tem serie_id = null
 * - Série pertence ao usuário
 * - Volume não está ocupado por outro livro da série
 */
export async function linkBookToSerie(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const book_id = (formData.get("book_id") as string)?.trim();
  const serie_id = (formData.get("serie_id") as string)?.trim();
  if (!book_id || !serie_id) {
    return { ok: false, message: "Livro ou série inválido." };
  }

  const volumeRaw = formData.get("volume") as string | null;
  const volume =
    volumeRaw && volumeRaw.trim() !== "" ? Number(volumeRaw) || null : null;

  // Verifica que o livro pode ser vinculado.
  const { data: book } = await supabase
    .from("book")
    .select("id, serie_id, user_id")
    .eq("id", book_id)
    .maybeSingle();
  if (!book || book.user_id !== user.id) {
    return { ok: false, message: "Livro não encontrado." };
  }
  if (book.serie_id !== null) {
    return {
      ok: false,
      message: "Este livro já está vinculado a outra série.",
    };
  }

  // Verifica série.
  const { data: serie } = await supabase
    .from("serie")
    .select("id, user_id")
    .eq("id", serie_id)
    .maybeSingle();
  if (!serie || serie.user_id !== user.id) {
    return { ok: false, message: "Série não encontrada." };
  }

  // Volume colide?
  if (volume !== null) {
    const { data: collision } = await supabase
      .from("book")
      .select("id, title")
      .eq("user_id", user.id)
      .eq("serie_id", serie_id)
      .eq("volume", volume)
      .maybeSingle();
    if (collision) {
      return {
        ok: false,
        message: `Volume ${volume} já está ocupado em "${collision.title}".`,
        field: "volume",
      };
    }
  }

  const { error } = await supabase
    .from("book")
    .update({ serie_id, volume })
    .eq("id", book_id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  // Revalida caches dos dois lados.
  const serieSlug = formData.get("serie_slug") as string | null;
  if (serieSlug) revalidatePath(`/serie/${serieSlug}`);
  revalidatePath("/serie");
  revalidatePath("/book");
  return { ok: true };
}
