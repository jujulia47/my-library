import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import { planBookColor } from "@/utils/colorByHash";
import type { CapacityPeriod, PlanBookInput } from "@/utils/readingPlan";

export type ReadingPlanData = {
  /** Livros do plano (= Próximas leituras), com metas e página atual. */
  books: PlanBookInput[];
  /** Períodos de capacidade do usuário (todos — a lógica filtra por dia). */
  capacity: CapacityPeriod[];
};

type NextReadRaw = {
  position: number;
  book: {
    id: string;
    slug: string;
    title: string;
    pages: number | null;
    cover: string | null;
  } | null;
};

/**
 * Carrega os dados do plano v2:
 *  - Livros: direto de home_next_read (Próximas leituras) — a fila é a ordem
 *    de lá; as duas listas são a MESMA lista.
 *  - Página atual: max(current_page) das leituras do livro (progresso vem do
 *    botão Atualizar, nada é registrado no plano).
 *  - Metas (reading_target) por livro e períodos de capacidade.
 */
export async function getReadingPlan(userId: string): Promise<ReadingPlanData> {
  const supabase = await createClient();

  const [{ data: nextReadsRaw }, { data: targetsRaw }, { data: capacityRaw }] =
    await Promise.all([
      supabase
        .from("home_next_read")
        .select(`position, book:book_id(id, slug, title, pages, cover)`)
        .eq("user_id", userId)
        .order("position", { ascending: true }),
      supabase
        .from("reading_target")
        .select(
          "id, book_id, start_date, end_date, page_from, page_to, carried_over",
        )
        .eq("user_id", userId)
        .order("page_from", { ascending: true }),
      supabase
        .from("reading_capacity")
        .select("id, start_date, end_date, pages_per_day")
        .eq("user_id", userId)
        .order("start_date", { ascending: true }),
    ]);

  const nextReads = (nextReadsRaw as unknown as NextReadRaw[] | null) ?? [];
  const bookIds = nextReads
    .filter((nr) => nr.book)
    .map((nr) => nr.book!.id);

  // Página atual por livro (max current_page entre as leituras).
  const currentByBook = new Map<string, number>();
  if (bookIds.length > 0) {
    const { data: readings } = await supabase
      .from("reading")
      .select("book_id, current_page")
      .eq("user_id", userId)
      .in("book_id", bookIds);
    for (const r of readings ?? []) {
      const page = r.current_page ?? 0;
      if (page > (currentByBook.get(r.book_id) ?? 0)) {
        currentByBook.set(r.book_id, page);
      }
    }
  }

  // Metas agrupadas por livro.
  const targetsByBook = new Map<string, ReadingPlanData["books"][0]["targets"]>();
  for (const t of targetsRaw ?? []) {
    const list = targetsByBook.get(t.book_id) ?? [];
    list.push({
      id: t.id,
      book_id: t.book_id,
      start_date: t.start_date,
      end_date: t.end_date,
      page_from: t.page_from,
      page_to: t.page_to,
      carried_over: t.carried_over,
    });
    targetsByBook.set(t.book_id, list);
  }

  const books: PlanBookInput[] = nextReads
    .filter((nr) => nr.book)
    .map((nr, index) => ({
      book_id: nr.book!.id,
      title: nr.book!.title,
      slug: nr.book!.slug,
      color: planBookColor(index),
      cover_url: nr.book!.cover ? imagesUrl(nr.book!.cover) : null,
      total_pages: nr.book!.pages,
      current_page: currentByBook.get(nr.book!.id) ?? 0,
      position: nr.position,
      targets: targetsByBook.get(nr.book!.id) ?? [],
    }));

  const capacity: CapacityPeriod[] = (capacityRaw ?? []).map((c) => ({
    id: c.id,
    start_date: c.start_date,
    end_date: c.end_date,
    pages_per_day: c.pages_per_day,
  }));

  return { books, capacity };
}
