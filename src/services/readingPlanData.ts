import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import { todayISO, currentMonthISO, addMonthsISO } from "@/utils/dates";
import { planBookColor } from "@/utils/colorByHash";
import type { CapacityPeriod, PlanBookInput } from "@/utils/readingPlan";

export type ReadingPlanData = {
  /** Mês visado (YYYY-MM-01). */
  monthISO: string;
  /** É o mês corrente? (habilita o painel "Hoje" e a edição). */
  isCurrentMonth: boolean;
  /** Livros do plano do mês: fila (home_next_read) + metas que cruzam o mês. */
  books: PlanBookInput[];
  /** Períodos de capacidade do usuário (todos — a lógica filtra por dia). */
  capacity: CapacityPeriod[];
};

type BookMeta = {
  id: string;
  slug: string;
  title: string;
  pages: number | null;
  cover: string | null;
};

type NextReadRaw = {
  position: number;
  pages_planned: number | null;
  book: BookMeta | null;
};

/**
 * Carrega os dados do plano de um MÊS. Um livro entra no plano do mês se:
 *  - tem entrada na fila do mês (home_next_read.plan_month = mês), OU
 *  - tem alguma meta (reading_target) cujo período cruza o mês.
 * Livros de meta mostram TODAS as suas metas (a meta é um "todo").
 *
 * Página atual = max(current_page) das leituras; pages_read_today = soma dos
 * deltas do log de hoje (só faz sentido no mês corrente).
 */
export async function getReadingPlan(
  userId: string,
  monthISO?: string,
): Promise<ReadingPlanData> {
  const supabase = await createClient();

  const month = monthISO ?? currentMonthISO();
  const nextMonth = addMonthsISO(month, 1);
  const isCurrentMonth = month === currentMonthISO();

  const [{ data: nextReadsRaw }, { data: targetsRaw }, { data: capacityRaw }] =
    await Promise.all([
      supabase
        .from("home_next_read")
        .select(
          `position, pages_planned, book:book_id(id, slug, title, pages, cover)`,
        )
        .eq("user_id", userId)
        .eq("plan_month", month)
        .order("position", { ascending: true }),
      supabase
        .from("reading_target")
        .select(
          "id, book_id, start_date, end_date, page_from, page_to, carried_over, replan_from_date, replan_from_page",
        )
        .eq("user_id", userId)
        .order("page_from", { ascending: true }),
      supabase
        .from("reading_capacity")
        .select("id, start_date, end_date, pages_per_day")
        .eq("user_id", userId)
        .order("start_date", { ascending: true }),
    ]);

  const filaRows = (nextReadsRaw as unknown as NextReadRaw[] | null) ?? [];
  const allTargets = targetsRaw ?? [];

  // Livros cujas metas cruzam o mês (period ∩ mês ≠ ∅).
  const targetBookIds = new Set(
    allTargets
      .filter((t) => t.start_date < nextMonth && t.end_date >= month)
      .map((t) => t.book_id),
  );

  // Metas dos livros que não estão na fila do mês precisam da capa/título.
  const filaBookIds = new Set(
    filaRows.filter((r) => r.book).map((r) => r.book!.id),
  );
  const missingBookIds = [...targetBookIds].filter(
    (id) => !filaBookIds.has(id),
  );
  const extraBooks = new Map<string, BookMeta>();
  if (missingBookIds.length > 0) {
    const { data } = await supabase
      .from("book")
      .select("id, slug, title, pages, cover")
      .eq("user_id", userId)
      .in("id", missingBookIds);
    for (const b of (data as BookMeta[] | null) ?? []) {
      extraBooks.set(b.id, b);
    }
  }

  // Ordem de exibição: fila (por position) primeiro, metas-sem-fila depois.
  type Entry = {
    book: BookMeta;
    position: number;
    pages_planned: number | null;
  };
  const entries: Entry[] = [];
  for (const r of filaRows) {
    if (r.book) {
      entries.push({
        book: r.book,
        position: r.position,
        pages_planned: r.pages_planned,
      });
    }
  }
  let extraPos = 1000;
  for (const id of missingBookIds) {
    const b = extraBooks.get(id);
    if (b) entries.push({ book: b, position: extraPos++, pages_planned: null });
  }

  const bookIds = entries.map((e) => e.book.id);

  // Página atual por livro (max current_page entre as leituras) e páginas
  // lidas HOJE (soma dos deltas do log). O "lido hoje" é o que permite dizer
  // "cota do dia cumprida" sem recalcular a meta.
  const currentByBook = new Map<string, number>();
  const readTodayByBook = new Map<string, number>();
  if (bookIds.length > 0) {
    const { data: readings } = await supabase
      .from("reading")
      .select("id, book_id, current_page")
      .eq("user_id", userId)
      .in("book_id", bookIds);
    const bookByReading = new Map<string, string>();
    for (const r of readings ?? []) {
      bookByReading.set(r.id, r.book_id);
      const page = r.current_page ?? 0;
      if (page > (currentByBook.get(r.book_id) ?? 0)) {
        currentByBook.set(r.book_id, page);
      }
    }

    const readingIds = [...bookByReading.keys()];
    if (readingIds.length > 0) {
      const { data: logs } = await supabase
        .from("reading_progress_log")
        .select("reading_id, pages_delta")
        .eq("user_id", userId)
        .eq("log_date", todayISO())
        .in("reading_id", readingIds);
      for (const l of logs ?? []) {
        const bookId = bookByReading.get(l.reading_id);
        if (!bookId) continue;
        readTodayByBook.set(
          bookId,
          (readTodayByBook.get(bookId) ?? 0) + Math.max(0, l.pages_delta),
        );
      }
    }
  }

  // Metas agrupadas por livro (todas — o livro de meta mostra o "todo").
  const targetsByBook = new Map<string, ReadingPlanData["books"][0]["targets"]>();
  for (const t of allTargets) {
    const list = targetsByBook.get(t.book_id) ?? [];
    list.push({
      id: t.id,
      book_id: t.book_id,
      start_date: t.start_date,
      end_date: t.end_date,
      page_from: t.page_from,
      page_to: t.page_to,
      carried_over: t.carried_over,
      replan_from_date: t.replan_from_date,
      replan_from_page: t.replan_from_page,
    });
    targetsByBook.set(t.book_id, list);
  }

  const books: PlanBookInput[] = entries.map((e, index) => ({
    book_id: e.book.id,
    title: e.book.title,
    slug: e.book.slug,
    color: planBookColor(index),
    cover_url: e.book.cover ? imagesUrl(e.book.cover) : null,
    total_pages: e.book.pages,
    current_page: currentByBook.get(e.book.id) ?? 0,
    pages_read_today: readTodayByBook.get(e.book.id) ?? 0,
    pages_planned: e.pages_planned,
    position: e.position,
    targets: targetsByBook.get(e.book.id) ?? [],
  }));

  const capacity: CapacityPeriod[] = (capacityRaw ?? []).map((c) => ({
    id: c.id,
    start_date: c.start_date,
    end_date: c.end_date,
    pages_per_day: c.pages_per_day,
  }));

  return { monthISO: month, isCurrentMonth, books, capacity };
}
