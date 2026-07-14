// Núcleo de cálculo do planejamento mensal de leitura. Funções puras — sem
// Supabase, sem React — pra manter a matemática testável e reusável entre a
// página do plano e o relatório de fim de mês.

/** Pior caso de ritmo de leitura: 1min20s por página (80s). */
export const SECONDS_PER_PAGE = 80;

/** Dias no mês (month 1–12). */
export function daysInMonth(year: number, month: number): number {
  // Dia 0 do mês seguinte = último dia deste mês.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "YYYY-MM-DD" do dia `day` do mês. */
export function isoForDay(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** Soma `n` dias a uma data ISO (UTC), devolvendo ISO. */
export function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Contagem inclusiva de dias entre duas ISO (a ≤ b → ≥ 1). */
export function inclusiveDays(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00Z`).getTime();
  const b = new Date(`${bISO}T00:00:00Z`).getTime();
  return Math.floor((b - a) / 86_400_000) + 1;
}

export type PlanBookInput = {
  book_id: string;
  title: string;
  /**
   * Páginas que ENTRAM na conta (o que falta ler). Já desconta o que foi lido.
   * Null = sem contagem de páginas (fica fora da conta).
   */
  pages: number | null;
  start_date: string | null;
  pages_per_day: number | null;
  end_date: string | null;
  /** Cor estável do livro pras barras do calendário. */
  color: string;
  /** Sobrescritas por dia: { "YYYY-MM-DD": páginas }. */
  overrides?: Record<string, number>;
  /** Páginas LIDAS de verdade por dia: { "YYYY-MM-DD": páginas } (do log). */
  actualByDay?: Record<string, number>;
};

export type BookSchedule = {
  book_id: string;
  title: string;
  color: string;
  pages: number;
  start_date: string;
  end_date: string;
  pages_per_day: number;
  days: number;
  /** Páginas por dia: { "YYYY-MM-DD": páginas } (já aplica overrides). */
  allocations: Record<string, number>;
  /** True quando o usuário mexeu em algum dia manualmente. */
  hasOverrides: boolean;
};

/**
 * Deriva o cronograma de um livro a partir do agendamento base.
 *
 * Precisa de `pages` > 0, `start_date`, e UM entre `pages_per_day` / `end_date`
 * (o outro é calculado). Retorna null se faltar dado essencial (livro fica
 * "não agendado" — aparece na lista, mas não no calendário).
 *
 * Regras:
 *  - pages_per_day D → days = ceil(pages / D); end = start + (days-1).
 *  - end_date E      → days = inclusiveDays(start, E); D = ceil(pages / days).
 * Alocação uniforme (D por dia); o último dia recebe o resto pra somar `pages`.
 * Overrides substituem o valor do dia (sem recalcular o fim — é ajuste fino).
 */
export function deriveSchedule(
  input: PlanBookInput,
  minStartISO?: string,
): BookSchedule | null {
  const { pages, start_date } = input;
  const overrides = input.overrides ?? {};

  // 1) Base uniforme a partir do ritmo/fim (quando derivável).
  const allocations: Record<string, number> = {};
  if (pages && pages > 0 && start_date) {
    const effStart =
      minStartISO && start_date < minStartISO ? minStartISO : start_date;
    let pagesPerDay: number | null = null;
    let days = 0;
    if (input.pages_per_day && input.pages_per_day > 0) {
      pagesPerDay = input.pages_per_day;
      days = Math.max(1, Math.ceil(pages / pagesPerDay));
    } else if (input.end_date && input.end_date >= effStart) {
      days = inclusiveDays(effStart, input.end_date);
      pagesPerDay = Math.max(1, Math.ceil(pages / days));
    }
    if (pagesPerDay) {
      let remaining = pages;
      for (let i = 0; i < days; i += 1) {
        const day = addDaysISO(effStart, i);
        const isLast = i === days - 1;
        const base = isLast ? remaining : Math.min(pagesPerDay, remaining);
        allocations[day] = Math.max(0, base);
        remaining -= base;
      }
    }
  }

  // 2) Overrides do usuário substituem/adicionam dias específicos (item 3 —
  //    planejamento manual). Funciona mesmo sem ritmo base (planejar só alguns
  //    dias avulsos).
  let hasOverrides = false;
  for (const [day, val] of Object.entries(overrides)) {
    allocations[day] = Math.max(0, val);
    hasOverrides = true;
  }

  // Dias com páginas > 0.
  const dayKeys = Object.keys(allocations)
    .filter((d) => allocations[d] > 0)
    .sort();
  if (dayKeys.length === 0) return null;

  const startISO = dayKeys[0];
  const endISO = dayKeys[dayKeys.length - 1];
  const days = dayKeys.length;
  const totalAlloc = dayKeys.reduce((s, d) => s + allocations[d], 0);
  const pagesPerDay = Math.max(1, Math.round(totalAlloc / days));

  return {
    book_id: input.book_id,
    title: input.title,
    color: input.color,
    pages: pages ?? totalAlloc,
    start_date: startISO,
    end_date: endISO,
    pages_per_day: pagesPerDay,
    days,
    allocations,
    hasOverrides,
  };
}

export type DayCell = {
  day: number;
  iso: string;
  /** Livros PLANEJADOS nesse dia. */
  entries: { book_id: string; title: string; color: string; pages: number }[];
  /** Soma de páginas planejadas no dia (todos os livros). */
  planned: number;
  /** Livros LIDOS de verdade nesse dia (do log). */
  actualEntries: {
    book_id: string;
    title: string;
    color: string;
    pages: number;
  }[];
  /** Soma de páginas lidas de verdade no dia. */
  actual: number;
  /** Dia já passou (iso ≤ hoje). */
  isPast: boolean;
};

export type PlanSummary = {
  year: number;
  month: number;
  daysInMonth: number;
  /** Total de páginas dos livros COM contagem. */
  totalPages: number;
  /** Livros sem `pages` cadastrado (ficam fora da conta). */
  booksWithoutPages: number;
  /** Livros com agendamento válido (entram no calendário). */
  scheduledBooks: number;
  /** Total de livros no plano. */
  totalBooks: number;
  /** Dia de referência (hoje) dentro da janela, ou null se mês passado/futuro. */
  windowStartDay: number;
  /** Dias restantes até o fim do mês (a partir de windowStartDay). */
  remainingDays: number;
  /** Meta de páginas/dia = totalPages / remainingDays (arredonda pra cima). */
  dailyTarget: number;
  /** Estimativa de tempo total em segundos (pior caso). */
  totalSeconds: number;
  /** Grade de dias do mês com alocações. */
  cells: DayCell[];
  // --- Saldo cumulativo (plano × real) até hoje ---
  /** Soma do planejado dos dias que já passaram (≤ hoje). */
  plannedToDate: number;
  /** Soma do lido de verdade dos dias que já passaram (≤ hoje). */
  actualToDate: number;
  /** actualToDate − plannedToDate. Positivo = adiantada; negativo = atrasada. */
  balance: number;
};

/**
 * Monta o resumo completo do plano de um mês: totais, meta diária, tempo e a
 * grade dia-a-dia com as alocações de cada livro.
 *
 * `referenceISO` (hoje) define a janela pro cálculo da meta:
 *  - mês corrente → do dia de hoje até o fim do mês ("faltam X dias");
 *  - mês passado/futuro → mês inteiro.
 */
export function buildPlanSummary(
  year: number,
  month: number,
  books: PlanBookInput[],
  referenceISO: string,
): PlanSummary {
  const totalDays = daysInMonth(year, month);
  // Sem trava no hoje: o plano distribui a partir da data de início definida,
  // pra que dias passados também tenham "planejado" e o saldo cumulativo faça
  // sentido. Pra "resetar", o usuário re-planeja (início = hoje).
  const schedules = books
    .map((b) => deriveSchedule(b))
    .filter((s): s is BookSchedule => s !== null);

  // Total/meta contam TODOS os livros do plano (a "visão do todo": quero ler
  // esses N livros, quantas páginas/dia preciso). `pages` já é o restante.
  const totalPages = books.reduce((sum, b) => sum + (b.pages ?? 0), 0);
  const booksWithoutPages = books.filter((b) => !b.pages || b.pages <= 0).length;

  // Mapa de livro → cor/título pra montar as entradas de "lido".
  const bookMeta = new Map(
    books.map((b) => [b.book_id, { title: b.title, color: b.color }]),
  );

  // Janela pra meta diária. Se hoje cai dentro do mês, conta de hoje ao fim.
  const firstISO = isoForDay(year, month, 1);
  const lastISO = isoForDay(year, month, totalDays);
  let windowStartDay = 1;
  if (referenceISO >= firstISO && referenceISO <= lastISO) {
    windowStartDay = Number(referenceISO.slice(8, 10));
  } else if (referenceISO > lastISO) {
    // Mês já passou — janela = mês inteiro (usado só pra exibição histórica).
    windowStartDay = 1;
  }
  const remainingDays = Math.max(1, totalDays - windowStartDay + 1);
  const dailyTarget = totalPages > 0 ? Math.ceil(totalPages / remainingDays) : 0;

  // Grade dia-a-dia (planejado + real).
  const cells: DayCell[] = [];
  let plannedToDate = 0;
  let actualToDate = 0;
  for (let day = 1; day <= totalDays; day += 1) {
    const iso = isoForDay(year, month, day);

    // Planejado do dia.
    const entries: DayCell["entries"] = [];
    for (const s of schedules) {
      const pages = s.allocations[iso];
      if (pages && pages > 0) {
        entries.push({
          book_id: s.book_id,
          title: s.title,
          color: s.color,
          pages,
        });
      }
    }
    const planned = entries.reduce((sum, e) => sum + e.pages, 0);

    // Lido de verdade do dia (do log de progresso).
    const actualEntries: DayCell["actualEntries"] = [];
    for (const b of books) {
      const pages = b.actualByDay?.[iso];
      if (pages && pages > 0) {
        const meta = bookMeta.get(b.book_id);
        actualEntries.push({
          book_id: b.book_id,
          title: meta?.title ?? b.title,
          color: meta?.color ?? b.color,
          pages,
        });
      }
    }
    const actual = actualEntries.reduce((sum, e) => sum + e.pages, 0);

    const isPast = iso <= referenceISO;
    if (isPast) {
      plannedToDate += planned;
      actualToDate += actual;
    }

    cells.push({ day, iso, entries, planned, actualEntries, actual, isPast });
  }

  return {
    year,
    month,
    daysInMonth: totalDays,
    totalPages,
    booksWithoutPages,
    scheduledBooks: schedules.length,
    totalBooks: books.length,
    windowStartDay,
    remainingDays,
    dailyTarget,
    totalSeconds: totalPages * SECONDS_PER_PAGE,
    cells,
    plannedToDate,
    actualToDate,
    balance: actualToDate - plannedToDate,
  };
}

/** Formata segundos em "Xh Ymin" (ou "Ymin" quando < 1h). */
export function formatReadingTime(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function monthNamePT(month: number): string {
  return MONTHS_PT[month - 1] ?? "";
}
