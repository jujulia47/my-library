"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/utils/dates";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Grava uma sessão de leitura cronometrada e integra com o resto:
 *  - atualiza a página atual da leitura (se avançou);
 *  - registra o progresso no log de hoje (mesma lógica do updateReading) —
 *    é o que o plano usa como âncora do "lido hoje";
 *  - insere a linha em reading_session, que alimenta o ritmo real.
 *
 * `pages` da sessão = quanto avançou (end_page − página anterior). Só livro
 * físico/ebook (o cliente não abre sessão pra audiobook).
 */
export async function recordReadingSession(input: {
  reading_id: string;
  end_page: number;
  seconds: number;
  scene?: string | null;
}): Promise<ActionResult<{ pages: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { reading_id, end_page, seconds, scene } = input;
  if (!reading_id) return { ok: false, message: "Sessão sem leitura." };

  const { data: reading } = await supabase
    .from("reading")
    .select("id, book_id, current_page, user_id")
    .eq("id", reading_id)
    .maybeSingle();
  if (!reading || reading.user_id !== user.id) {
    return { ok: false, message: "Leitura não encontrada." };
  }

  const prev = reading.current_page ?? 0;
  const endPage = Number.isFinite(end_page)
    ? Math.max(0, Math.round(end_page))
    : prev;
  const delta = Math.max(0, endPage - prev);
  const secs = Math.max(0, Math.round(seconds));

  // Atualiza a página atual (só se avançou).
  if (endPage > prev) {
    await supabase
      .from("reading")
      .update({ current_page: endPage })
      .eq("id", reading_id);
  }

  // Registra o progresso no log de hoje (âncora do "lido hoje" do plano).
  if (delta > 0) {
    const today = todayISO();
    const { data: existingLog } = await supabase
      .from("reading_progress_log")
      .select("pages_delta")
      .eq("reading_id", reading_id)
      .eq("log_date", today)
      .maybeSingle();
    await supabase.from("reading_progress_log").upsert(
      {
        user_id: user.id,
        reading_id,
        log_date: today,
        pages_delta: (existingLog?.pages_delta ?? 0) + delta,
      },
      { onConflict: "reading_id,log_date" },
    );
  }

  // Grava a sessão (alimenta o ritmo real).
  const { error } = await supabase.from("reading_session").insert({
    user_id: user.id,
    book_id: reading.book_id,
    reading_id,
    seconds: secs,
    pages: delta,
    scene: scene ?? null,
  });
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/today");
  revalidatePath("/plano");
  return { ok: true, data: { pages: delta } };
}
