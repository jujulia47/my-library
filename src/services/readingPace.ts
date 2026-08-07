import { createClient } from "@/utils/supabase/server";
import { SECONDS_PER_PAGE } from "@/utils/readingPlan";

const WINDOW_DAYS = 7;
/** Mínimo de páginas na janela pra confiar no ritmo medido (senão, fallback). */
const MIN_PAGES = 15;

/**
 * Ritmo REAL de leitura (segundos/página) da usuária, pela média móvel das
 * sessões dos últimos dias. Quando não há dados suficientes, cai no valor fixo
 * de referência (SECONDS_PER_PAGE). Só sessões contam — todas são físico/ebook.
 */
export async function getUserSecondsPerPage(userId: string): Promise<number> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);

  const { data } = await supabase
    .from("reading_session")
    .select("seconds, pages")
    .eq("user_id", userId)
    .gte("started_at", since.toISOString());

  let secs = 0;
  let pages = 0;
  for (const s of data ?? []) {
    secs += s.seconds ?? 0;
    pages += s.pages ?? 0;
  }
  if (pages < MIN_PAGES) return SECONDS_PER_PAGE;

  // Sanidade: entre 15s e 300s por página (evita outliers absurdos).
  return Math.max(15, Math.min(300, Math.round(secs / pages)));
}
