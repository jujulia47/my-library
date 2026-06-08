"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/utils/readingEvents";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Atualização rápida do `current_page` de uma reading. Usada pela home
 * dashboard pra avançar progresso sem abrir o modal completo de edição.
 *
 * Diferenças do updateReading:
 *  - Não toca em status, format, datas, rating, review
 *  - Funciona apenas em readings com status `reading` ou `paused`
 *  - Mantém o log de progresso (reading_progress_log) igual ao updateReading
 */
export async function updateReadingProgress(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "Leitura inválida." };

  const raw = formData.get("current_page") as string | null;
  if (raw === null || raw === "") {
    return {
      ok: false,
      message: "Informe a página atual.",
      field: "current_page",
    };
  }
  const current_page = Number(raw);
  if (!Number.isFinite(current_page) || current_page < 0) {
    return {
      ok: false,
      message: "Página inválida.",
      field: "current_page",
    };
  }

  // Data em que as páginas foram lidas. Default = hoje; usuário pode informar
  // outra (típico: esqueceu de registrar ontem). Não aceita data no futuro.
  const logDateRaw = (formData.get("log_date") as string | null)?.trim() || "";
  const today = todayISO();
  const logDate = logDateRaw || today;
  if (logDate > today) {
    return {
      ok: false,
      message: "Data de leitura não pode ser no futuro.",
      field: "log_date",
    };
  }

  const { data: existing } = await supabase
    .from("reading")
    .select("status, current_page")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return { ok: false, message: "Leitura não encontrada." };
  }
  if (existing.status !== "reading" && existing.status !== "paused") {
    return {
      ok: false,
      message: "Só é possível atualizar progresso de leituras em andamento ou pausadas.",
    };
  }

  const previousPage = existing.current_page ?? 0;

  const { error } = await supabase
    .from("reading")
    .update({ current_page })
    .eq("id", id);
  if (error) return { ok: false, ...translateSupabaseError(error) };

  const delta = current_page - previousPage;
  if (delta > 0) {
    const { data: existingLog } = await supabase
      .from("reading_progress_log")
      .select("pages_delta")
      .eq("reading_id", id)
      .eq("log_date", logDate)
      .maybeSingle();
    const finalDelta = (existingLog?.pages_delta ?? 0) + delta;
    await supabase.from("reading_progress_log").upsert(
      {
        user_id: user.id,
        reading_id: id,
        log_date: logDate,
        pages_delta: finalDelta,
      },
      { onConflict: "reading_id,log_date" },
    );
  }

  const slug = formData.get("book_slug") as string | null;
  revalidatePath("/");
  revalidatePath("/book");
  if (slug) revalidatePath(`/book/${slug}`);
  return { ok: true };
}
