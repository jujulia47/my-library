// Plano de leitura v2 — lógica pura (sem Supabase, sem React).
//
// Modelo: o usuário fornece 3 entradas e TODO o resto é derivado.
//  1. Metas (reading_target): "ler da página X à Y até DD/MM".
//  2. Capacidade (reading_capacity): páginas/dia por período.
//  3. Fila: ordem dos livros sem meta (home_next_read.position).
//
// Progresso vem da página atual do livro (reading.current_page). Não existe
// registro de leitura dentro do plano nem distribuição manual por dia — os
// números são recalculados a cada visita. Única ação manual: numa meta
// VENCIDA o usuário pode clicar pra jogar o restante na meta seguinte
// (carried_over); sem o clique ela fica só marcada como vencida.

/** Pior caso de ritmo de leitura: 1min20s por página (80s). */
export const SECONDS_PER_PAGE = 80;

// ============================================================================
// Datas
// ============================================================================

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isoForDay(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

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

/** Formata segundos em "Xh Ymin" (ou "Ymin" quando < 1h). */
export function formatReadingTime(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ============================================================================
// Entradas
// ============================================================================

export type TargetInput = {
  id: string;
  book_id: string;
  start_date: string;
  end_date: string;
  page_from: number;
  page_to: number;
  /**
   * Vencida "replanejada": o usuário clicou pra jogar o restante na meta
   * seguinte. Sem o clique, a vencida fica só marcada (nada transborda).
   */
  carried_over: boolean;
  /**
   * Recalculo MANUAL: dia/página em que o usuário mandou redistribuir o que
   * falta. Null = cronograma original (a partir de start_date/page_from).
   */
  replan_from_date: string | null;
  replan_from_page: number | null;
};

export type CapacityPeriod = {
  id: string;
  start_date: string;
  end_date: string;
  pages_per_day: number;
};

export type PlanBookInput = {
  book_id: string;
  title: string;
  slug: string;
  color: string;
  cover_url: string | null;
  /** Total de páginas do livro (null = sem contagem, fica fora da matemática). */
  total_pages: number | null;
  /** Página atual (0 se não começou). Vem da leitura ativa. */
  current_page: number;
  /**
   * Páginas lidas HOJE (reading_progress_log). É o que permite dizer "cota do
   * dia cumprida" sem recalcular nada.
   */
  pages_read_today: number;
  /**
   * Páginas deste livro planejadas pro mês (só fila, sem meta). Null = livro
   * todo (restante). Limita o total do mês e a projeção da fila.
   */
  pages_planned: number | null;
  /** Ordem na fila (home_next_read.position). */
  position: number;
  /** Metas do livro (vazio = livro de fila). */
  targets: TargetInput[];
};

// ============================================================================
// Metas — derivação
// ============================================================================

export type TargetStatus =
  | "concluida"
  | "vencida"
  | "atrasada"
  | "em_dia"
  | "futura";

export type TargetStats = {
  target: TargetInput;
  /** Total definido da meta (page_to − page_from + 1). */
  totalPages: number;
  /** Páginas/dia do cronograma vigente (original ou pós-recálculo). */
  originalDaily: number;
  /**
   * Restante EFETIVO da meta. Assume que as metas anteriores serão cumpridas;
   * só transborda pra cá o que o usuário JOGOU de uma vencida (carried_over).
   * Cada página conta em exatamente uma meta — nada duplica.
   */
  remainingPages: number;
  /** Dias de hoje (ou do início, se futura) até o prazo. */
  remainingDays: number;
  /**
   * Cota de hoje — FIXA durante o dia inteiro. Nunca sobe sozinha: no máximo
   * é a cota do cronograma; cai quando você está adiantada. Null = nada a
   * ler hoje (concluída, vencida ou futura).
   */
  todayQuota: number | null;
  /** Páginas lidas hoje neste livro (do log). */
  readToday: number;
  /** Cota de hoje já cumprida. */
  doneToday: boolean;
  /** Páginas lidas hoje além da cota E do atraso — adiantamento real. */
  aheadToday: number;
  /**
   * Páginas que ficaram de dias ANTERIORES (o "não li ontem"), já abatidas
   * do que você leu a mais hoje. Mostrado separado — nunca é somado na cota
   * de hoje sem você mandar.
   */
  backlog: number;
  /**
   * true quando o atraso vem de ANTES desta meta (a meta anterior não foi
   * terminada e você ainda não chegou no início desta). "Recalcular" não
   * resolve isso — o caminho é jogar a meta anterior na seguinte.
   */
  backlogInherited: boolean;
  /** Página que o cronograma espera que você alcance até o fim de hoje. */
  targetPageToday: number | null;
  /** Cota dos dias DEPOIS de hoje (pro calendário). */
  futureDaily: number;
  status: TargetStatus;
};

/**
 * Deriva o estado de uma meta com CRONOGRAMA FIXO.
 *
 * Regra central (a que evita a confusão do "número que nunca fecha"): a cota
 * do dia é constante ao longo do dia e **só pode diminuir** em relação ao
 * cronograma — se você adianta, os próximos dias aliviam; se atrasa, a cota
 * NÃO infla sozinha: o que ficou pra trás aparece como `backlog` e só entra
 * na conta se você clicar em recalcular (replan_from_date/page).
 *
 * - concluída: página atual ≥ page_to.
 * - vencida:   prazo passou com restante > 0. Só transborda pra meta seguinte
 *              se o usuário jogou (carried_over).
 * - ativa:     atrasada quando há backlog; senão em dia.
 * - futura:    ainda não começou.
 *
 * `fromPage` é o ponteiro virtual de deriveBookTargets (ver lá).
 */
export function deriveTarget(
  target: TargetInput,
  currentPage: number,
  todayISO: string,
  fromPage: number = currentPage,
  pagesReadToday: number = 0,
): TargetStats {
  const totalPages = target.page_to - target.page_from + 1;

  // Cronograma vigente: original, ou reiniciado no ponto do recálculo manual.
  const baseDate = target.replan_from_date ?? target.start_date;
  const basePage = target.replan_from_page ?? target.page_from - 1;
  // Se uma meta anterior foi JOGADA pra cá (carried_over), o ponteiro `fromPage`
  // vem ABAIXO do início desta meta. Nesse caso o cronograma passa a espalhar
  // TAMBÉM o que ficou faltando — a cota diária sobe (em vez de as páginas
  // ficarem só como backlog). Sem carryover, fromPage ≥ basePage e nada muda.
  const effectiveBase = Math.min(basePage, fromPage);
  const scheduleDays = Math.max(1, inclusiveDays(baseDate, target.end_date));
  const scheduledPages = Math.max(0, target.page_to - effectiveBase);
  const originalDaily = Math.ceil(scheduledPages / scheduleDays);

  // Restante efetivo a partir do ponteiro (herda só o que foi jogado pra cá).
  const remainingPages = Math.max(0, target.page_to - fromPage);

  const base = {
    target,
    totalPages,
    originalDaily,
    remainingPages,
    todayQuota: null,
    readToday: pagesReadToday,
    doneToday: false,
    aheadToday: 0,
    backlog: 0,
    backlogInherited: false,
    targetPageToday: null,
    futureDaily: 0,
  };

  if (currentPage >= target.page_to) {
    return {
      ...base,
      remainingPages: 0,
      remainingDays: 0,
      status: "concluida",
    };
  }

  if (todayISO > target.end_date) {
    return { ...base, remainingDays: 0, status: "vencida" };
  }

  if (todayISO < baseDate) {
    return {
      ...base,
      remainingDays: scheduleDays,
      futureDaily: originalDaily,
      status: "futura",
    };
  }

  // --- Meta ativa ---------------------------------------------------------
  const remainingDays = inclusiveDays(todayISO, target.end_date);

  // Onde a leitura estava no COMEÇO de hoje (o log diz o que foi lido hoje).
  const pageAtStartOfToday = Math.max(0, currentPage - pagesReadToday);
  const pagesLeftStartOfToday = Math.max(0, target.page_to - pageAtStartOfToday);

  // Cota do dia: no máximo a do cronograma; menor se está adiantada. Ambos os
  // insumos são constantes durante o dia → a cota não se mexe.
  const relieved = Math.ceil(pagesLeftStartOfToday / remainingDays);
  const todayQuota = Math.max(0, Math.min(originalDaily, relieved));

  // Atraso: onde o cronograma esperava que você estivesse no fim de ONTEM.
  const daysBeforeToday = Math.max(
    0,
    inclusiveDays(baseDate, todayISO) - 1,
  );
  const expectedByYesterday = Math.min(
    target.page_to,
    effectiveBase + originalDaily * daysBeforeToday,
  );
  const debtAtStartOfToday = Math.max(
    0,
    expectedByYesterday - pageAtStartOfToday,
  );
  // O que você leu HOJE além da cota abate a dívida dos dias anteriores antes
  // de contar como adiantamento — senão apareceria "atrasada" e "adiantada"
  // ao mesmo tempo.
  const surplusToday = Math.max(0, pagesReadToday - todayQuota);
  const backlog = Math.max(0, debtAtStartOfToday - surplusToday);
  // Atraso HERDADO: você ainda não chegou no início desta meta (a anterior não
  // foi terminada). Recalcular não ajuda aqui — é caso de "jogar na seguinte".
  const backlogInherited = backlog > 0 && currentPage < target.page_from - 1;

  const doneToday = todayQuota > 0 && pagesReadToday >= todayQuota;
  const targetPageToday = Math.min(
    target.page_to,
    pageAtStartOfToday + todayQuota,
  );
  const daysAfterToday = remainingDays - 1;
  const futureDaily =
    daysAfterToday > 0
      ? Math.min(
          originalDaily,
          Math.ceil((target.page_to - targetPageToday) / daysAfterToday),
        )
      : 0;

  return {
    ...base,
    remainingDays,
    todayQuota,
    doneToday,
    aheadToday: Math.max(0, surplusToday - debtAtStartOfToday),
    backlog,
    backlogInherited,
    targetPageToday,
    futureDaily,
    status: backlog > 0 ? "atrasada" : "em_dia",
  };
}

/**
 * Deriva as metas de um livro EM CADEIA (ordem de páginas), com um ponteiro
 * virtual de onde a leitura chega antes de cada meta:
 *
 * - concluída/ativa/futura: assume que será cumprida → ponteiro vai pro fim
 *   dela (a meta seguinte mostra só a própria fatia).
 * - vencida SEM carried_over: ponteiro também avança — o restante fica só
 *   marcado nela, não transborda nem duplica em lugar nenhum.
 * - vencida COM carried_over (usuário clicou em replanejar): ponteiro NÃO
 *   avança → o restante entra na conta da meta SEGUINTE (e só dela).
 */
export function deriveBookTargets(
  targets: TargetInput[],
  currentPage: number,
  todayISO: string,
  pagesReadToday: number = 0,
): TargetStats[] {
  const sorted = targets.slice().sort((a, z) => a.page_from - z.page_from);
  let virtualPage = currentPage;
  const out: TargetStats[] = [];
  for (const t of sorted) {
    const stats = deriveTarget(
      t,
      currentPage,
      todayISO,
      virtualPage,
      pagesReadToday,
    );
    out.push(stats);
    if (!(stats.status === "vencida" && t.carried_over)) {
      virtualPage = Math.max(virtualPage, t.page_to);
    }
  }
  return out;
}

/**
 * Página que o cronograma das metas espera que você tenha alcançado ao FIM de
 * `dateISO`, partindo da página atual. Usado só pra ancorar a faixa "de X a Y"
 * do mês — o TOTAL de páginas continua vindo das contribuições diárias.
 */
export function scheduledMetaPage(
  targets: TargetInput[],
  currentPage: number,
  dateISO: string,
): number {
  let page = currentPage;
  const sorted = targets.slice().sort((a, z) => a.page_from - z.page_from);
  for (const t of sorted) {
    const baseDate = t.replan_from_date ?? t.start_date;
    const basePage = t.replan_from_page ?? t.page_from - 1;
    if (dateISO >= t.end_date) {
      page = Math.max(page, t.page_to);
    } else if (dateISO >= baseDate) {
      const days = Math.max(1, inclusiveDays(baseDate, t.end_date));
      const daily = Math.ceil((t.page_to - basePage) / days);
      const elapsed = inclusiveDays(baseDate, dateISO);
      page = Math.max(page, Math.min(t.page_to, basePage + daily * elapsed));
    }
  }
  return page;
}

// ============================================================================
// Capacidade — período mais estreito vence
// ============================================================================

export function capacityForDay(
  dayISO: string,
  periods: CapacityPeriod[],
): number | null {
  let best: CapacityPeriod | null = null;
  let bestSpan = Number.POSITIVE_INFINITY;
  for (const p of periods) {
    if (dayISO < p.start_date || dayISO > p.end_date) continue;
    const span = inclusiveDays(p.start_date, p.end_date);
    if (span < bestSpan) {
      best = p;
      bestSpan = span;
    }
  }
  return best ? best.pages_per_day : null;
}

// ============================================================================
// O plano do mês (derivação completa)
// ============================================================================

export type DayEntry = {
  book_id: string;
  title: string;
  color: string;
  pages: number;
  /** "lido" = leitura REAL de um dia passado (histórico); "meta"/"fila" = plano. */
  kind: "meta" | "fila" | "lido";
  /** true no dia em que o livro foi terminado (marca "terminou aqui"). */
  finished?: boolean;
};

/** Uma leitura REAL de um dia (do reading_progress_log) — preenche o passado. */
export type PlanHistoryEntry = {
  date: string;
  book_id: string;
  title: string;
  color: string;
  pages: number;
  /** true se o livro foi terminado nesta data. */
  finished?: boolean;
};

export type PlanDay = {
  day: number;
  iso: string;
  isPast: boolean;
  capacity: number | null;
  /** Orçamento de leitura do dia (capacidade OU média) — 0 em dias passados. */
  budget: number;
  entries: DayEntry[];
  /** Prazos de meta que vencem neste dia (títulos dos livros). */
  deadlines: string[];
};

export type QueueProjection = {
  book_id: string;
  /** Primeiro dia em que o livro recebe páginas (ISO), null se não anda. */
  startISO: string | null;
  /** Dia em que termina (ISO), null se não termina dentro do mês. */
  endISO: string | null;
  /** Páginas que sobram no fim do mês (0 = termina). */
  leftAtMonthEnd: number;
};

export type MonthPlan = {
  year: number;
  month: number;
  days: PlanDay[];
  /** Projeção da fila (livros sem meta, em ordem). */
  queue: QueueProjection[];
  // --- Referência estática ---
  /**
   * Páginas que vou ler NESTE mês: metas contam só a fatia do mês (dividida
   * por dia nas que cruzam a virada); fila conta pages_planned (ou o livro
   * todo por default).
   */
  monthPageTotal: number;
  /** Dias restantes no mês (de hoje ao fim; mês inteiro se fora dele). */
  remainingDaysInMonth: number;
  /** Média diária necessária pra ler o planejado do mês. */
  neededAvg: number;
  /** Capacidade total planejada nos dias restantes (null se nada definido). */
  capacityTotal: number | null;
  /** Dias (restantes) em que as metas sozinhas passam da capacidade. */
  daysOverCapacity: string[];
  /** Atraso a recuperar HOJE (páginas do déficit diluídas no dia). */
  catchupToday: number;
  /** Livros sem contagem de páginas (fora da matemática). */
  booksWithoutPages: number;
  /** Segundos/página usado nas estimativas de tempo (ritmo real ou fixo). */
  secondsPerPage: number;
};

/**
 * Deriva o plano do mês inteiro: dia a dia (metas + fila), projeção da fila e
 * os números de referência. Visão SEMPRE atual ("re-planejar" automático):
 * metas contribuem com o neededDaily de hoje; a fila consome a sobra da
 * capacidade em ordem.
 */
export function buildMonthPlan(
  year: number,
  month: number,
  books: PlanBookInput[],
  capacity: CapacityPeriod[],
  todayISO: string,
  spreadUntil: string | null = null,
  history: PlanHistoryEntry[] = [],
  secondsPerPage: number = SECONDS_PER_PAGE,
): MonthPlan {
  const totalDays = daysInMonth(year, month);
  const firstISO = isoForDay(year, month, 1);
  const lastISO = isoForDay(year, month, totalDays);

  // Histórico real por dia (dias PASSADOS mostram o que foi lido, não o plano).
  const historyByDate = new Map<string, DayEntry[]>();
  for (const h of history) {
    const list = historyByDate.get(h.date) ?? [];
    list.push({
      book_id: h.book_id,
      title: h.title,
      color: h.color,
      pages: h.pages,
      kind: "lido",
      finished: h.finished,
    });
    historyByDate.set(h.date, list);
  }

  const readable = books.filter(
    (b) => b.total_pages !== null && b.total_pages > 0,
  );
  const booksWithoutPages = books.length - readable.length;

  // Metas derivadas por livro (em cadeia — ver deriveBookTargets).
  const targetStats = new Map<string, TargetStats[]>();
  for (const b of readable) {
    const stats = deriveBookTargets(
      b.targets,
      b.current_page,
      todayISO,
      b.pages_read_today,
    );
    if (stats.length > 0) targetStats.set(b.book_id, stats);
  }

  // Orçamento que as metas consomem HOJE = por livro, o maior entre a cota
  // planejada do dia e o que você já leu de meta. Cobre metas CONCLUÍDAS hoje
  // (que saem do targetSum, mas cujas páginas lidas já gastaram orçamento) —
  // assim a fila fica com a sobra real, não com os 130 inteiros.
  let metaBudgetToday = 0;
  for (const b of readable) {
    if ((b.targets?.length ?? 0) === 0) continue;
    const stats = targetStats.get(b.book_id) ?? [];
    const active = stats.find(
      (s) => s.status === "em_dia" || s.status === "atrasada",
    );
    metaBudgetToday += Math.max(active?.todayQuota ?? 0, b.pages_read_today);
  }

  // Contribuição diária de cada meta (só dias >= hoje; passado não é
  // planejável). Hoje usa a cota fixa do dia; os dias seguintes, futureDaily.
  const bookMeta = new Map(readable.map((b) => [b.book_id, b]));
  const targetDaily = (iso: string): DayEntry[] => {
    if (iso < todayISO) return [];
    const entries: DayEntry[] = [];
    for (const [bookId, stats] of targetStats) {
      const b = bookMeta.get(bookId)!;
      for (const s of stats) {
        if (s.status === "concluida" || s.status === "vencida") continue;
        const from = s.status === "futura" ? s.target.start_date : todayISO;
        if (iso < from || iso > s.target.end_date) continue;
        const pages =
          iso === todayISO ? (s.todayQuota ?? 0) : s.futureDaily;
        if (pages <= 0) continue;
        entries.push({
          book_id: bookId,
          title: b.title,
          color: b.color,
          pages,
          kind: "meta",
        });
      }
    }
    return entries;
  };

  // Fila: livros SEM meta, em ordem de position. Consome a sobra por dia.
  const queueBooks = readable
    .filter((b) => (b.targets?.length ?? 0) === 0)
    .sort((a, z) => a.position - z.position);
  // Restante no INÍCIO de hoje (página atual − lido hoje). Ancora tanto a
  // alocação FIXA do dia quanto o total do mês: ler durante o dia não muda
  // current−lido (sobem juntos), então nada reembaralha. Nos dias seguintes o
  // plano recalcula com a página real; `pages_planned` limita ao planejado.
  const remainingAtStartOfToday = (b: PlanBookInput): number => {
    const startPage = Math.max(0, b.current_page - b.pages_read_today);
    const remaining = Math.max(0, (b.total_pages ?? 0) - startPage);
    return b.pages_planned != null
      ? Math.min(remaining, Math.max(0, b.pages_planned))
      : remaining;
  };
  const queueRemaining = new Map(
    queueBooks.map((b) => [b.book_id, remainingAtStartOfToday(b)]),
  );
  const queueProj = new Map<string, QueueProjection>(
    queueBooks.map((b) => [
      b.book_id,
      {
        book_id: b.book_id,
        startISO: null,
        endISO: null,
        leftAtMonthEnd: queueRemaining.get(b.book_id) ?? 0,
      },
    ]),
  );

  // Pré-cálculo do mês: páginas de meta (fatia do mês) e se há capacidade.
  // Sem capacidade definida, o orçamento diário implícito é a MÉDIA necessária
  // (neededAvg) — a fila consome a sobra dela em ordem, igual à capacidade.
  let hasCapacityInMonth = false;
  let metaMonthPages = 0;
  let capacityTotalPre = 0;
  for (let day = 1; day <= totalDays; day += 1) {
    const iso = isoForDay(year, month, day);
    if (iso < todayISO) continue;
    const cap = capacityForDay(iso, capacity);
    if (cap !== null) {
      hasCapacityInMonth = true;
      capacityTotalPre += cap;
    }
    metaMonthPages += targetDaily(iso).reduce((s, e) => s + e.pages, 0);
  }
  // Total do mês ancorado no INÍCIO de hoje (igual à fila) — ler durante o dia
  // não muda o "necessário"; ele só recalcula no dia seguinte, e diminui de
  // fato quando você lê ALÉM do planejado ou tira um livro da fila.
  const filaMonthPages = queueBooks.reduce(
    (s, b) => s + remainingAtStartOfToday(b),
    0,
  );
  // Total do mês no INÍCIO de hoje (fixo durante o dia).
  const startOfTodayMonthPages = metaMonthPages + filaMonthPages;
  const remainingDaysInMonth =
    todayISO >= firstISO && todayISO <= lastISO
      ? inclusiveDays(todayISO, lastISO)
      : totalDays;
  // Média usada no PLANEJAMENTO (orçamento da fila sem capacidade) — baseada
  // no total do início do dia, estável durante o dia.
  const planningAvg =
    startOfTodayMonthPages > 0
      ? Math.ceil(startOfTodayMonthPages / remainingDaysInMonth)
      : 0;

  // Diluição do atraso: se a capacidade não cobre o plano e há data escolhida,
  // espalha o déficit (X/dia) do dia até a data — esse extra ENTRA no orçamento
  // da fila desses dias, então os livros somam orçamento + atraso.
  const deficit = hasCapacityInMonth
    ? Math.max(0, startOfTodayMonthPages - capacityTotalPre)
    : 0;
  const catchupUntil =
    deficit > 0 && spreadUntil && spreadUntil >= todayISO
      ? spreadUntil > lastISO
        ? lastISO
        : spreadUntil
      : null;
  const catchupPerDay = catchupUntil
    ? Math.ceil(deficit / Math.max(1, inclusiveDays(todayISO, catchupUntil)))
    : 0;

  const days: PlanDay[] = [];
  const daysOverCapacity: string[] = [];
  let capacityTotal: number | null = null;
  let anyCapacity = false;

  let queueIdx = 0;
  for (let day = 1; day <= totalDays; day += 1) {
    const iso = isoForDay(year, month, day);
    const isPast = iso < todayISO;
    const cap = capacityForDay(iso, capacity);
    // Passado = histórico real (o que foi lido); hoje/futuro = plano das metas.
    const entries = isPast ? (historyByDate.get(iso) ?? []) : targetDaily(iso);
    const targetSum = entries.reduce((s, e) => s + e.pages, 0);

    // Orçamento de leitura do dia (capacidade OU média). É o total geral que
    // você pode ler no dia, pra qualquer livro. 0 em dias passados.
    const budget = isPast
      ? 0
      : hasCapacityInMonth
        ? (cap ?? 0)
        : planningAvg;

    if (!isPast) {
      if (cap !== null) {
        anyCapacity = true;
        capacityTotal = (capacityTotal ?? 0) + cap;
        if (targetSum > cap) daysOverCapacity.push(iso);
      }

      // Nos dias do período de diluição, o atraso/dia entra no orçamento — a
      // fila lê a mais pra recuperar (por isso as linhas somam orçamento +
      // atraso).
      const inCatchup =
        catchupPerDay > 0 && catchupUntil !== null && iso <= catchupUntil;
      const dayBudget = budget + (inCatchup ? catchupPerDay : 0);

      // A fila consome a SOBRA em ORDEM. HOJE usa o orçamento que as metas
      // realmente consumiram (inclui as concluídas hoje); nos outros dias, a
      // cota planejada das metas.
      const metaSpent = iso === todayISO ? metaBudgetToday : targetSum;
      let leftover = Math.max(0, dayBudget - metaSpent);
      while (leftover > 0 && queueIdx < queueBooks.length) {
        const qb = queueBooks[queueIdx];
        const rem = queueRemaining.get(qb.book_id) ?? 0;
        if (rem <= 0) {
          queueIdx += 1;
          continue;
        }
        const take = Math.min(leftover, rem);
        queueRemaining.set(qb.book_id, rem - take);
        leftover -= take;
        entries.push({
          book_id: qb.book_id,
          title: qb.title,
          color: qb.color,
          pages: take,
          kind: "fila",
        });
        const proj = queueProj.get(qb.book_id)!;
        if (!proj.startISO) proj.startISO = iso;
        if (rem - take <= 0) {
          proj.endISO = iso;
          proj.leftAtMonthEnd = 0;
          queueIdx += 1;
        }
      }
    }

    // Prazos de meta do dia.
    const deadlines: string[] = [];
    for (const [bookId, stats] of targetStats) {
      for (const s of stats) {
        if (s.target.end_date === iso) {
          deadlines.push(bookMeta.get(bookId)!.title);
        }
      }
    }

    days.push({ day, iso, isPast, capacity: cap, budget, entries, deadlines });
  }

  // Sobra da fila no fim do mês.
  for (const [bookId, rem] of queueRemaining) {
    const proj = queueProj.get(bookId)!;
    if (proj.endISO === null) proj.leftAtMonthEnd = rem;
  }

  // O total do mês só encolhe DENTRO do dia quando você lê ALÉM do orçamento
  // do dia — o excedente dilui o "todo". Ler dentro do orçamento não mexe nos
  // números gerais (só entra/sai livro muda). No dia seguinte tudo recalcula.
  const todayBudget = days.find((d) => d.iso === todayISO)?.budget ?? 0;
  const totalReadToday = readable.reduce((s, b) => s + b.pages_read_today, 0);
  // O alvo do dia inclui o atraso diluído (orçamento + catchup). Ler as próprias
  // páginas do atraso é executar o plano, não "ler além" — só o que passa disso
  // dilui o total do mês.
  const overReadToday = Math.max(
    0,
    totalReadToday - (todayBudget + catchupPerDay),
  );
  const monthPageTotal = Math.max(0, startOfTodayMonthPages - overReadToday);
  const neededAvg =
    monthPageTotal > 0 ? Math.ceil(monthPageTotal / remainingDaysInMonth) : 0;

  return {
    year,
    month,
    days,
    queue: queueBooks.map((b) => queueProj.get(b.book_id)!),
    monthPageTotal,
    remainingDaysInMonth,
    neededAvg,
    capacityTotal: anyCapacity ? capacityTotal : null,
    daysOverCapacity,
    catchupToday: catchupPerDay,
    booksWithoutPages,
    secondsPerPage,
  };
}
