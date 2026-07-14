import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import { planBookColor } from "@/utils/colorByHash";
import { daysInMonth, deriveSchedule } from "@/utils/readingPlan";
import type { PlanBookInput } from "@/utils/readingPlan";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type PlanBookRow = PlanBookInput & {
  slug: string;
  cover_url: string | null;
  /** Total de páginas do livro (pra exibição). `pages` é o efetivo do mês. */
  total_pages: number | null;
  /** Páginas já lidas (da leitura em andamento/pausada). */
  pages_read: number;
  /** Restante real (total − lido), independente do campo do mês. */
  remaining: number | null;
  /** Páginas planejadas SÓ neste mês (campo do usuário). Null = usa restante. */
  pages_this_month: number | null;
  /** ID da linha em reading_plan_book (null se ainda não agendado/salvo). */
  plan_book_id: string | null;
  /** ID da leitura ativa (reading/paused) — pra registrar progresso do dia. */
  reading_id: string | null;
  /** Está atualmente em Próximas leituras (home_next_read). */
  in_next_reads: boolean;
  /** True quando o livro só aparece por transbordar de outro mês (só leitura). */
  is_continuation: boolean;
  /** Mês de origem quando é continuação. */
  continuation_from: { year: number; month: number } | null;
};

export type ReadingPlanData = {
  year: number;
  month: number;
  isCurrentMonth: boolean;
  books: PlanBookRow[];
  /** Meses (year, month) com plano salvo — pro seletor. Inclui o atual. */
  availableMonths: { year: number; month: number }[];
};

type BookJoin = {
  id: string;
  slug: string;
  title: string;
  pages: number | null;
  cover: string | null;
};

type PlanRowRaw = {
  id: string;
  book_id: string;
  year: number;
  month: number;
  start_date: string | null;
  pages_per_day: number | null;
  end_date: string | null;
  pages_this_month: number | null;
  position: number;
  book: BookJoin | null;
};

type NextReadRaw = {
  position: number;
  book: BookJoin | null;
};

function todayParts(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

/**
 * Carrega o plano de leitura de um mês.
 *
 * - Mês corrente: une os livros de Próximas leituras (home_next_read) com as
 *   linhas já salvas em reading_plan_book (que persistem mesmo se o livro saiu
 *   de Próximas leituras — ex.: foi concluído). Assim "sempre aparecem os de
 *   Próximas leituras" + os que você já agendou.
 * - Mês passado/futuro: só as linhas salvas (congelado).
 *
 * O agendamento (start/pace/end) e os overrides por dia vêm das tabelas
 * reading_plan_book / reading_plan_day_override. Cor por hash do título.
 */
export async function getReadingPlan(
  userId: string,
  year: number,
  month: number,
): Promise<ReadingPlanData> {
  const supabase = await createClient();
  const cur = todayParts();
  const isCurrentMonth = year === cur.year && month === cur.month;

  const [{ data: allRowsRaw }, nextReads, availableMonths] = await Promise.all([
    // TODAS as linhas do usuário (todos os meses) — pra detectar transbordo.
    supabase
      .from("reading_plan_book")
      .select(
        `id, book_id, year, month, start_date, pages_per_day, end_date,
         pages_this_month, position,
         book:book_id(id, slug, title, pages, cover)`,
      )
      .eq("user_id", userId)
      .order("position", { ascending: true }),
    isCurrentMonth
      ? fetchNextReadBooks(supabase, userId)
      : Promise.resolve([] as NextReadRaw[]),
    fetchAvailableMonths(supabase, userId, cur),
  ]);

  const allRows = (allRowsRaw as unknown as PlanRowRaw[] | null) ?? [];
  const planRows = allRows.filter(
    (r) => r.year === year && r.month === month,
  );
  const otherRows = allRows.filter(
    (r) => !(r.year === year && r.month === month),
  );

  // Overrides de todas as linhas (mês + outras que possam transbordar).
  const overridesByPlanBook = await fetchOverridesByIds(
    supabase,
    allRows.map((r) => r.id),
  );

  // Coleta todos os book_ids envolvidos pra buscar leitura + progresso.
  const allBookIds = new Set<string>();
  for (const r of allRows) if (r.book) allBookIds.add(r.book_id);
  for (const nr of nextReads) if (nr.book) allBookIds.add(nr.book.id);
  const reading = await fetchReadingInfo(supabase, userId, [...allBookIds]);
  const actualByBook = await fetchActualByDay(
    supabase,
    userId,
    reading.readingToBook,
    year,
    month,
  );

  // `pages` = restante (total − lido); guarda total/lido/real pra exibição.
  const buildRow = (
    book: BookJoin,
    fields: {
      start_date: string | null;
      pages_per_day: number | null;
      end_date: string | null;
      pages_this_month?: number | null;
      overrides: Record<string, number>;
      plan_book_id: string | null;
      in_next_reads: boolean;
      is_continuation?: boolean;
      continuation_from?: { year: number; month: number } | null;
    },
  ): PlanBookRow => {
    const total = book.pages;
    const read = reading.pagesReadByBook.get(book.id) ?? 0;
    const remaining = total !== null ? Math.max(0, total - read) : null;
    const ptm = fields.pages_this_month ?? null;
    // `pages` (efetivo do mês) = campo do usuário, senão o restante real.
    const effective = ptm !== null ? ptm : remaining;
    return {
      book_id: book.id,
      title: book.title,
      slug: book.slug,
      pages: effective,
      total_pages: total,
      pages_read: read,
      remaining,
      pages_this_month: ptm,
      reading_id: reading.activeReadingByBook.get(book.id) ?? null,
      actualByDay: actualByBook.get(book.id) ?? {},
      cover_url: book.cover ? imagesUrl(book.cover) : null,
      color: "#6D3914", // reatribuído por índice após ordenar
      is_continuation: false,
      continuation_from: null,
      ...fields,
    };
  };

  // Índice por book_id pra unir. Começa pelas linhas salvas do mês.
  const byBookId = new Map<string, PlanBookRow>();
  for (const row of planRows) {
    if (!row.book) continue;
    byBookId.set(
      row.book_id,
      buildRow(row.book, {
        start_date: row.start_date,
        pages_per_day: row.pages_per_day,
        end_date: row.end_date,
        pages_this_month: row.pages_this_month,
        overrides: overridesByPlanBook.get(row.id) ?? {},
        plan_book_id: row.id,
        in_next_reads: false,
      }),
    );
  }

  // Transbordo: livros de OUTROS meses cujo cronograma cruza este mês. Aparecem
  // como continuação (só leitura — edita no mês de origem).
  const firstISO = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = daysInMonth(year, month);
  const lastISO = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  for (const row of otherRows) {
    if (!row.book) continue;
    if (byBookId.has(row.book_id)) continue; // linha do mês tem prioridade
    const candidate = buildRow(row.book, {
      start_date: row.start_date,
      pages_per_day: row.pages_per_day,
      end_date: row.end_date,
      pages_this_month: row.pages_this_month,
      overrides: overridesByPlanBook.get(row.id) ?? {},
      plan_book_id: row.id,
      in_next_reads: false,
      is_continuation: true,
      continuation_from: { year: row.year, month: row.month },
    });
    // Cruza o mês? Deriva o cronograma e vê se há alocação nos dias do mês.
    const sched = deriveSchedule(candidate);
    if (!sched) continue;
    const overlaps = Object.keys(sched.allocations).some(
      (d) => sched.allocations[d] > 0 && d >= firstISO && d <= lastISO,
    );
    if (overlaps) byBookId.set(row.book_id, candidate);
  }

  // Une Próximas leituras (mês corrente): adiciona os que ainda não têm linha e
  // marca in_next_reads nos que já têm.
  for (const nr of nextReads) {
    if (!nr.book) continue;
    const existing = byBookId.get(nr.book.id);
    if (existing) {
      existing.in_next_reads = true;
      continue;
    }
    byBookId.set(
      nr.book.id,
      buildRow(nr.book, {
        start_date: null,
        pages_per_day: null,
        end_date: null,
        overrides: {},
        plan_book_id: null,
        in_next_reads: true,
      }),
    );
  }

  // Ordena: agendados primeiro (por start_date), depois o resto por título.
  const books = [...byBookId.values()].sort((a, b) => {
    const as = a.start_date ?? "9999";
    const bs = b.start_date ?? "9999";
    if (as !== bs) return as.localeCompare(bs);
    return a.title.localeCompare(b.title, "pt-BR");
  });

  // Cor por índice — garante contraste entre livros vizinhos na lista.
  books.forEach((b, i) => {
    b.color = planBookColor(i);
  });

  return { year, month, isCurrentMonth, books, availableMonths };
}

type ReadingInfo = {
  /** book_id → páginas já lidas (max current_page das leituras). */
  pagesReadByBook: Map<string, number>;
  /** book_id → id de uma leitura ativa (reading/paused), pra registrar. */
  activeReadingByBook: Map<string, string>;
  /** reading_id → book_id (todas as leituras dos livros do plano). */
  readingToBook: Map<string, string>;
};

/**
 * Info de leitura por livro: páginas lidas (max current_page), a leitura ativa
 * (pra registrar progresso) e o mapa reading→book (pra agregar o log por dia).
 */
async function fetchReadingInfo(
  supabase: SupabaseServer,
  userId: string,
  bookIds: string[],
): Promise<ReadingInfo> {
  const pagesReadByBook = new Map<string, number>();
  const activeReadingByBook = new Map<string, string>();
  const readingToBook = new Map<string, string>();
  if (bookIds.length === 0)
    return { pagesReadByBook, activeReadingByBook, readingToBook };

  const { data } = await supabase
    .from("reading")
    .select("id, book_id, current_page, status")
    .eq("user_id", userId)
    .in("book_id", bookIds);

  for (const row of data ?? []) {
    readingToBook.set(row.id, row.book_id);
    const page = row.current_page ?? 0;
    const prev = pagesReadByBook.get(row.book_id) ?? 0;
    if (page > prev) pagesReadByBook.set(row.book_id, page);
    // Prefere leitura ativa pra registrar progresso.
    if (
      (row.status === "reading" || row.status === "paused") &&
      !activeReadingByBook.has(row.book_id)
    ) {
      activeReadingByBook.set(row.book_id, row.id);
    }
  }
  return { pagesReadByBook, activeReadingByBook, readingToBook };
}

/**
 * Páginas lidas de verdade por (livro, dia) no mês — soma dos pages_delta do
 * reading_progress_log, agrupado por dia. Usa o mapa reading→book pra atribuir
 * cada log ao livro certo.
 */
async function fetchActualByDay(
  supabase: SupabaseServer,
  userId: string,
  readingToBook: Map<string, string>,
  year: number,
  month: number,
): Promise<Map<string, Record<string, number>>> {
  const map = new Map<string, Record<string, number>>();
  const readingIds = [...readingToBook.keys()];
  if (readingIds.length === 0) return map;

  const days = daysInMonth(year, month);
  const firstISO = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastISO = `${year}-${String(month).padStart(2, "0")}-${String(days).padStart(2, "0")}`;

  const { data } = await supabase
    .from("reading_progress_log")
    .select("reading_id, log_date, pages_delta")
    .eq("user_id", userId)
    .in("reading_id", readingIds)
    .gte("log_date", firstISO)
    .lte("log_date", lastISO);

  for (const row of data ?? []) {
    const bookId = readingToBook.get(row.reading_id);
    if (!bookId) continue;
    const byDay = map.get(bookId) ?? {};
    byDay[row.log_date] = (byDay[row.log_date] ?? 0) + (row.pages_delta ?? 0);
    map.set(bookId, byDay);
  }
  return map;
}

async function fetchNextReadBooks(
  supabase: SupabaseServer,
  userId: string,
): Promise<NextReadRaw[]> {
  const { data } = await supabase
    .from("home_next_read")
    .select(`position, book:book_id(id, slug, title, pages, cover)`)
    .eq("user_id", userId)
    .order("position", { ascending: true });
  return (data as unknown as NextReadRaw[] | null) ?? [];
}

async function fetchOverridesByIds(
  supabase: SupabaseServer,
  planBookIds: string[],
): Promise<Map<string, Record<string, number>>> {
  const map = new Map<string, Record<string, number>>();
  if (planBookIds.length === 0) return map;

  const { data } = await supabase
    .from("reading_plan_day_override")
    .select("plan_book_id, day, pages")
    .in("plan_book_id", planBookIds);
  for (const row of data ?? []) {
    const existing = map.get(row.plan_book_id) ?? {};
    existing[row.day] = row.pages;
    map.set(row.plan_book_id, existing);
  }
  return map;
}

async function fetchAvailableMonths(
  supabase: SupabaseServer,
  userId: string,
  cur: { year: number; month: number },
): Promise<{ year: number; month: number }[]> {
  const { data } = await supabase
    .from("reading_plan_book")
    .select("year, month")
    .eq("user_id", userId);
  const set = new Set<string>();
  const months: { year: number; month: number }[] = [];
  const push = (y: number, m: number) => {
    const key = `${y}-${m}`;
    if (set.has(key)) return;
    set.add(key);
    months.push({ year: y, month: m });
  };
  // Sempre inclui o mês corrente (mesmo sem plano ainda).
  push(cur.year, cur.month);
  for (const row of data ?? []) push(row.year, row.month);
  // Mais recente primeiro.
  months.sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month,
  );
  return months;
}
