import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import {
  todayISO,
  currentMonthISO,
  addMonthsISO,
  dateISOInAppTZ,
} from "@/utils/dates";
import { planBookColor, colorHexForName } from "@/utils/colorByHash";
import type {
  CapacityPeriod,
  PlanBookInput,
  PlanHistoryEntry,
} from "@/utils/readingPlan";

export type ReadingPlanData = {
  /** Mês visado (YYYY-MM-01). */
  monthISO: string;
  /** É o mês corrente? (habilita o painel "Hoje" e a edição). */
  isCurrentMonth: boolean;
  /** Livros do plano do mês: fila (home_next_read) + metas que cruzam o mês. */
  books: PlanBookInput[];
  /** Períodos de capacidade do usuário (todos — a lógica filtra por dia). */
  capacity: CapacityPeriod[];
  /** Diluir o atraso até esta data (YYYY-MM-DD), se definida pelo usuário. */
  spreadUntil: string | null;
  /** Leitura REAL do mês por dia (log) — preenche os dias passados do calendário. */
  history: PlanHistoryEntry[];
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

  const [
    { data: nextReadsRaw },
    { data: targetsRaw },
    { data: capacityRaw },
    { data: catchupRaw },
  ] = await Promise.all([
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
    supabase
      .from("reading_plan_catchup")
      .select("spread_until")
      .eq("user_id", userId)
      .eq("plan_month", month)
      .maybeSingle(),
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

  // Livros LIDOS HOJE que já saíram da fila (ex.: terminados hoje — o
  // finishReading remove a linha de home_next_read) continuam no plano do DIA e
  // só somem amanhã (quando não há mais log com a data de hoje). Sem isso, ao
  // terminar um livro da fila ele sumiria na hora, devolvendo o orçamento
  // inteiro pros outros e zerando o "lido hoje". Só no mês corrente. Entram com
  // position bem baixa (leitura travada consome o orçamento primeiro) e
  // pages_planned = lido hoje (contam só o que foi lido, não o restante).
  if (isCurrentMonth) {
    const { data: todayLogs } = await supabase
      .from("reading_progress_log")
      .select("reading_id, pages_delta")
      .eq("user_id", userId)
      .eq("log_date", todayISO());
    const logs = todayLogs ?? [];
    if (logs.length > 0) {
      const logReadingIds = [...new Set(logs.map((l) => l.reading_id))];
      const { data: readingsToday } = await supabase
        .from("reading")
        .select("id, book_id")
        .eq("user_id", userId)
        .in("id", logReadingIds);
      const bookByReading = new Map(
        (readingsToday ?? []).map((r) => [r.id, r.book_id]),
      );
      const ghostReadToday = new Map<string, number>();
      for (const l of logs) {
        const bookId = bookByReading.get(l.reading_id);
        if (!bookId) continue;
        ghostReadToday.set(
          bookId,
          (ghostReadToday.get(bookId) ?? 0) + Math.max(0, l.pages_delta),
        );
      }
      const ghostIds = [...ghostReadToday.entries()]
        .filter(
          ([id, read]) =>
            read > 0 && !filaBookIds.has(id) && !targetBookIds.has(id),
        )
        .map(([id]) => id);
      if (ghostIds.length > 0) {
        const { data: ghostBooks } = await supabase
          .from("book")
          .select("id, slug, title, pages, cover")
          .eq("user_id", userId)
          .in("id", ghostIds);
        const minPos = entries.reduce((m, e) => Math.min(m, e.position), 0);
        let ghostPos = minPos - ghostIds.length;
        for (const b of (ghostBooks as BookMeta[] | null) ?? []) {
          entries.push({
            book: b,
            position: ghostPos++,
            pages_planned: ghostReadToday.get(b.id) ?? 0,
          });
        }
      }
    }
  }

  const bookIds = entries.map((e) => e.book.id);

  // Página atual por livro (max current_page entre as leituras) e páginas
  // lidas HOJE (soma dos deltas do log). O "lido hoje" é o que permite dizer
  // "cota do dia cumprida" sem recalcular a meta.
  const currentByBook = new Map<string, number>();
  const readTodayByBook = new Map<string, number>();
  // Reconstrução do "lido hoje" pra leituras CRIADAS hoje cujo log ficou
  // faltando (bug antigo do createReading, já corrigido daqui pra frente): uma
  // leitura criada hoje não existia ontem, então TODA a current_page foi lida
  // hoje. Serve de PISO do lido-hoje (via max) pra a âncora do início do dia
  // não escorregar — e conserta os registros antigos sem precisar refazê-los.
  const startedTodayByBook = new Map<string, number>();
  if (bookIds.length > 0) {
    const { data: readings } = await supabase
      .from("reading")
      .select("id, book_id, current_page, created_at")
      .eq("user_id", userId)
      .in("book_id", bookIds);
    const bookByReading = new Map<string, string>();
    for (const r of readings ?? []) {
      bookByReading.set(r.id, r.book_id);
      const page = r.current_page ?? 0;
      if (page > (currentByBook.get(r.book_id) ?? 0)) {
        currentByBook.set(r.book_id, page);
      }
      if (page > 0 && r.created_at && dateISOInAppTZ(r.created_at) === todayISO()) {
        startedTodayByBook.set(
          r.book_id,
          (startedTodayByBook.get(r.book_id) ?? 0) + page,
        );
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
    pages_read_today: Math.max(
      readTodayByBook.get(e.book.id) ?? 0,
      startedTodayByBook.get(e.book.id) ?? 0,
    ),
    pages_planned: e.pages_planned,
    position: e.position,
    targets: targetsByBook.get(e.book.id) ?? [],
  }));

  // Só os períodos de capacidade que CRUZAM o mês visado — capacidade de
  // agosto não deve aparecer/valer em setembro.
  const capacity: CapacityPeriod[] = (capacityRaw ?? [])
    .filter((c) => c.start_date < nextMonth && c.end_date >= month)
    .map((c) => ({
      id: c.id,
      start_date: c.start_date,
      end_date: c.end_date,
      pages_per_day: c.pages_per_day,
    }));

  const spreadUntil =
    (catchupRaw as { spread_until: string } | null)?.spread_until ?? null;

  // Histórico REAL do mês (reading_progress_log): quanto foi lido de cada livro
  // em cada dia. Preenche os dias PASSADOS do calendário — inclui livros que já
  // saíram do plano (ex.: terminados), por isso busca título/cor à parte.
  const history: PlanHistoryEntry[] = [];
  {
    const { data: monthLogs } = await supabase
      .from("reading_progress_log")
      .select("reading_id, log_date, pages_delta")
      .eq("user_id", userId)
      .gte("log_date", month)
      .lt("log_date", nextMonth)
      .gt("pages_delta", 0);
    const logRows = monthLogs ?? [];
    if (logRows.length > 0) {
      const histReadingIds = [...new Set(logRows.map((l) => l.reading_id))];
      const { data: histReadings } = await supabase
        .from("reading")
        .select("id, book_id")
        .eq("user_id", userId)
        .in("id", histReadingIds);
      const bookByReading = new Map(
        (histReadings ?? []).map((r) => [r.id, r.book_id]),
      );
      // Páginas por (dia, livro).
      const byDayBook = new Map<string, number>();
      const histBookIds = new Set<string>();
      for (const l of logRows) {
        const bid = bookByReading.get(l.reading_id);
        if (!bid) continue;
        histBookIds.add(bid);
        const key = `${l.log_date}|${bid}`;
        byDayBook.set(key, (byDayBook.get(key) ?? 0) + l.pages_delta);
      }
      // Título e cor: reusa os livros do plano (mesma cor no passado e futuro);
      // busca título dos que já saíram do plano e dá cor estável por id.
      const colorByBookId = new Map(books.map((b) => [b.book_id, b.color]));
      const titleByBookId = new Map(books.map((b) => [b.book_id, b.title]));
      const missingTitles = [...histBookIds].filter(
        (id) => !titleByBookId.has(id),
      );
      if (missingTitles.length > 0) {
        const { data: histBooks } = await supabase
          .from("book")
          .select("id, title")
          .eq("user_id", userId)
          .in("id", missingTitles);
        for (const b of (histBooks as { id: string; title: string }[] | null) ??
          []) {
          titleByBookId.set(b.id, b.title);
        }
      }
      for (const [key, pages] of byDayBook) {
        const sep = key.indexOf("|");
        const date = key.slice(0, sep);
        const bid = key.slice(sep + 1);
        history.push({
          date,
          book_id: bid,
          title: titleByBookId.get(bid) ?? "—",
          color: colorByBookId.get(bid) ?? colorHexForName(bid),
          pages,
        });
      }
    }
  }

  return {
    monthISO: month,
    isCurrentMonth,
    books,
    capacity,
    spreadUntil,
    history,
  };
}
