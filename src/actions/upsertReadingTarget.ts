"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export type ReadingTargetInput = {
  /** Presente = edição; ausente = criação. */
  id?: string;
  book_id: string;
  start_date: string;
  end_date: string;
  page_from: number;
  page_to: number;
};

/**
 * Cria/edita uma meta de leitura ("ler da página X à Y até DD/MM").
 *
 * Validações:
 *  - intervalo de páginas dentro do total do livro;
 *  - páginas e datas coerentes (from ≤ to, início ≤ fim);
 *  - sem sobreposição de PÁGINAS com outras metas do mesmo livro.
 */
export async function upsertReadingTarget(
  input: ReadingTargetInput,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { book_id } = input;
  if (!book_id) return { ok: false, message: "Livro inválido." };

  const page_from = Math.floor(input.page_from);
  const page_to = Math.floor(input.page_to);
  if (!Number.isFinite(page_from) || page_from < 1) {
    return { ok: false, message: "Página inicial inválida.", field: "page_from" };
  }
  if (!Number.isFinite(page_to) || page_to < page_from) {
    return {
      ok: false,
      message: "Página final deve ser maior ou igual à inicial.",
      field: "page_to",
    };
  }
  if (!input.start_date || !input.end_date || input.end_date < input.start_date) {
    return {
      ok: false,
      message: "Período inválido — o fim deve ser depois do início.",
      field: "end_date",
    };
  }

  // Meta não pode passar do total de páginas do livro.
  const { data: book } = await supabase
    .from("book")
    .select("id, pages")
    .eq("id", book_id)
    .maybeSingle();
  if (!book) return { ok: false, message: "Livro não encontrado." };
  if (book.pages !== null && page_to > book.pages) {
    return {
      ok: false,
      message: `A meta passa do total do livro (${book.pages} páginas).`,
      field: "page_to",
    };
  }

  // Sem sobreposição de páginas com outras metas do mesmo livro.
  const { data: siblings } = await supabase
    .from("reading_target")
    .select("id, page_from, page_to")
    .eq("user_id", user.id)
    .eq("book_id", book_id);
  const overlap = (siblings ?? []).find(
    (s) =>
      s.id !== input.id &&
      page_from <= s.page_to &&
      page_to >= s.page_from,
  );
  if (overlap) {
    return {
      ok: false,
      message: `Conflita com outra meta desse livro (páginas ${overlap.page_from}–${overlap.page_to}).`,
      field: "page_from",
    };
  }

  if (input.id) {
    const { error } = await supabase
      .from("reading_target")
      .update({
        start_date: input.start_date,
        end_date: input.end_date,
        page_from,
        page_to,
        // Editou a meta = replanejou por conta própria; o "jogar na próxima"
        // e o recálculo manual voltam ao estado inicial (senão o cronograma
        // continuaria ancorado num ponto que não existe mais).
        carried_over: false,
        replan_from_date: null,
        replan_from_page: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", user.id);
    if (error) return { ok: false, ...translateSupabaseError(error) };
    revalidatePath("/plano");
    return { ok: true, data: { id: input.id } };
  }

  const { data, error } = await supabase
    .from("reading_target")
    .insert({
      user_id: user.id,
      book_id,
      start_date: input.start_date,
      end_date: input.end_date,
      page_from,
      page_to,
    })
    .select("id")
    .single();
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/plano");
  return { ok: true, data: { id: data.id } };
}
