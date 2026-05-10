"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

export async function createQuoteForBook(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const book_id = formData.get("book_id") as string;
  if (!book_id) return { ok: false, message: "Livro inválido." };

  const text = (formData.get("text") as string)?.trim();
  if (!text)
    return { ok: false, message: "Citação obrigatória.", field: "text" };

  const pageRaw = formData.get("page") as string | null;
  const page = pageRaw && pageRaw !== "" ? Number(pageRaw) || null : null;
  const chapter = (formData.get("chapter") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;
  const author_name = (formData.get("author_name") as string)?.trim() || null;

  const slugSeed = text.slice(0, 60) || crypto.randomUUID().slice(0, 8);
  const slug = `${formateTitleToSlug(slugSeed)}-${crypto.randomUUID().slice(0, 6)}`;

  const { error } = await supabase.from("quote").insert({
    text,
    page,
    chapter,
    note,
    author_name,
    slug,
    book_id,
    user_id: user.id,
  });
  if (error) return { ok: false, ...translateSupabaseError(error) };

  const bookSlug = formData.get("book_slug") as string | null;
  if (bookSlug) revalidatePath(`/book/${bookSlug}`);
  revalidatePath("/quote");
  return { ok: true };
}

export async function updateQuoteText(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "Citação inválida." };

  const text = (formData.get("text") as string)?.trim();
  if (!text)
    return { ok: false, message: "Citação obrigatória.", field: "text" };

  const pageRaw = formData.get("page") as string | null;
  const page = pageRaw && pageRaw !== "" ? Number(pageRaw) || null : null;
  const chapter = (formData.get("chapter") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;
  const author_name = (formData.get("author_name") as string)?.trim() || null;

  // Slug acompanha o texto da citação. Sufixo UUID protege contra colisão.
  const slugSeed = text.slice(0, 60) || crypto.randomUUID().slice(0, 8);
  const newSlug = `${formateTitleToSlug(slugSeed)}-${crypto.randomUUID().slice(0, 6)}`;

  const { error } = await supabase
    .from("quote")
    .update({ text, slug: newSlug, page, chapter, note, author_name })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  const bookSlug = formData.get("book_slug") as string | null;
  if (bookSlug) revalidatePath(`/book/${bookSlug}`);
  revalidatePath("/quote");
  revalidatePath(`/quote/${newSlug}`);
  return { ok: true };
}

export async function deleteQuoteById(
  id: string,
  bookSlug?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { error } = await supabase.from("quote").delete().eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  if (bookSlug) revalidatePath(`/book/${bookSlug}`);
  revalidatePath("/quote");
  return { ok: true };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Marca livro como doado. Retorna ActionResult padrão. `code` distingue
 * categorias de erro pra UI (ex: `invalid_dates` → mostra inline no campo de
 * data; `invalid_input` → erro genérico).
 */
export async function markBookDisposed(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { ok: false, code: "invalid_input", message: "Não autenticado." };

  const id = formData.get("id") as string;
  const slug = formData.get("book_slug") as string | null;
  const rawDate = (formData.get("disposed_date") as string) ?? "";

  if (!id) {
    return { ok: false, code: "invalid_input", message: "Livro inválido." };
  }

  let disposed_date: string | null;
  if (rawDate.trim() === "") {
    disposed_date = null;
  } else if (ISO_DATE.test(rawDate)) {
    disposed_date = rawDate;
  } else {
    return {
      ok: false,
      code: "invalid_dates",
      field: "disposed_date",
      message: "Data inválida.",
    };
  }

  if (disposed_date) {
    // Migrado de acquisition_date → acquired_at (sessão 15.2). A semântica é a
    // mesma: garantir que descarte não vem antes da aquisição.
    const { data: book } = await supabase
      .from("book")
      .select("acquired_at")
      .eq("id", id)
      .maybeSingle();
    const acq = book?.acquired_at ?? null;
    if (acq && disposed_date < acq) {
      return {
        ok: false,
        code: "invalid_dates",
        field: "disposed_date",
        message: `A data de doação não pode ser anterior à data de aquisição (${acq}).`,
      };
    }
  }

  // Sessão 17.2: enum `ownership_status` reescrito; `disposed` virou `donated`
  // (mapping decidido na sessão). DisposeBookModal continua chamando essa
  // action — semanticamente "marcar como doado" preserva a intenção.
  // Sessão 17.2.6: lê estado anterior pra decidir se cria entry no
  // histórico. Trigger automático foi dropado.
  const { data: existing } = await supabase
    .from("book")
    .select("ownership_status")
    .eq("id", id)
    .maybeSingle();
  const previousStatus = existing?.ownership_status ?? null;

  const { error } = await supabase
    .from("book")
    .update({ ownership_status: "donated", disposed_date })
    .eq("id", id);
  if (error) {
    return { ok: false, code: "invalid_input", ...translateSupabaseError(error) };
  }

  if (previousStatus !== "donated") {
    // Sem campo dedicado de data no DisposeBookModal: usa disposed_date
    // se vier, senão NOW. Path principal de status-changes é o BookFull
    // form; aqui é só pra preservar o histórico mínimo.
    const changedAt = disposed_date
      ? `${disposed_date}T12:00:00Z`
      : new Date().toISOString();
    const { error: histErr } = await supabase
      .from("book_status_history")
      .insert({
        book_id: id,
        user_id: user.id,
        status: "donated",
        changed_at: changedAt,
        notes: null,
      });
    if (histErr) {
      console.error("[markBookDisposed] history insert failed:", histErr);
    }
  }

  if (slug) revalidatePath(`/book/${slug}`);
  revalidatePath("/book");
  return { ok: true };
}
