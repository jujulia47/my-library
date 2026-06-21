"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Adiciona um livro à curadoria de "próximas leituras" da home.
 *
 * - Atribui `position = (max + 1)` pra colocar o novo card no fim do carrossel.
 * - `unique (user_id, book_id)` no banco impede duplicar; se já existe,
 *   retorna sucesso silencioso (idempotente).
 */
export async function addHomeNextRead(
  bookId: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  // Já existe? Idempotente: devolve o id existente sem recriar.
  const { data: existing } = await supabase
    .from("home_next_read")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();
  if (existing) {
    return { ok: true, data: { id: existing.id } };
  }

  // Próxima posição = max atual + 1 (sequência simples, gaps OK).
  const { data: maxRow } = await supabase
    .from("home_next_read")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("home_next_read")
    .insert({
      user_id: user.id,
      book_id: bookId,
      position: nextPosition,
    })
    .select("id")
    .single();
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/");
  return { ok: true, data: { id: data.id } };
}
