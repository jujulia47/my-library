import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

type Country = Database["public"]["Enums"]["country"];
type BookLanguage = Database["public"]["Enums"]["book_language"];
type SerieStatus = Database["public"]["Enums"]["serie_status"];

/** País → continente (mesmo mapa do passaporte). */
const CONTINENT: Record<Country, string> = {
  africa_do_sul: "África",
  angola: "África",
  cabo_verde: "África",
  egito: "África",
  mocambique: "África",
  argentina: "América do Sul",
  brasil: "América do Sul",
  chile: "América do Sul",
  colombia: "América do Sul",
  peru: "América do Sul",
  canada: "América do Norte",
  cuba: "América do Norte",
  estados_unidos: "América do Norte",
  mexico: "América do Norte",
  china: "Ásia",
  coreia_do_sul: "Ásia",
  india: "Ásia",
  israel: "Ásia",
  japao: "Ásia",
  turquia: "Ásia",
  alemanha: "Europa",
  espanha: "Europa",
  franca: "Europa",
  holanda: "Europa",
  hungria: "Europa",
  irlanda: "Europa",
  italia: "Europa",
  noruega: "Europa",
  polonia: "Europa",
  portugal: "Europa",
  reino_unido: "Europa",
  republica_tcheca: "Europa",
  russia: "Europa",
  suecia: "Europa",
  australia: "Oceania",
  venezuela: "América do Sul",
  quenia: "África",
  dinamarca: "Europa",
  niassalandia: "África",
  suica: "Europa",
  jerusalem: "Ásia",
};

export type Achievement = {
  key: string;
  name: string;
  desc: string;
  glyph: string;
  cur: number;
  goal: number;
  unlocked: boolean;
  /** Data (ISO YYYY-MM-DD) em que foi conquistada, quando dá pra saber. */
  earned: string | null;
  /** Texto do que falta (só quando bloqueada). */
  hint: string | null;
};

export type AchievementCategory = {
  name: string;
  color: string;
  items: Achievement[];
};

export type AchievementsData = {
  categories: AchievementCategory[];
  unlockedCount: number;
  totalCount: number;
};

type ReadingRow = {
  id: string;
  start_date: string | null;
  finish_date: string | null;
  book: {
    id: string;
    pages: number | null;
    language: BookLanguage | null;
    created_at: string;
    serie_id: string | null;
    book_author: { author: { id: string; country: Country | null } | null }[] | null;
  } | null;
};

type SerieRow = {
  id: string;
  name: string;
  status: SerieStatus;
  qty_volumes: number | null;
  finish_date: string | null;
};

// ---- helpers de agregação ----

/** Distinct set + a data em que o set atingiu o alvo (replay por finish_date). */
function distinctReach(
  events: { date: string | null; keys: string[] }[],
  goal: number,
): { cur: number; earned: string | null } {
  const full = new Set<string>();
  for (const e of events) for (const k of e.keys) full.add(k);

  const dated = events
    .filter((e) => e.date)
    .sort((a, b) => a.date!.localeCompare(b.date!));
  const acc = new Set<string>();
  let earned: string | null = null;
  for (const e of dated) {
    for (const k of e.keys) acc.add(k);
    if (!earned && acc.size >= goal) earned = e.date;
  }
  return { cur: full.size, earned };
}

/** Máximo acumulado dentro de um ano-calendário + data em que cruzou o alvo. */
function yearlyReach(
  events: { date: string | null; amount: number; bookId: string }[],
  goal: number,
): { cur: number; earned: string | null } {
  const byYear = new Map<number, { date: string; amount: number; bookId: string }[]>();
  for (const e of events) {
    if (!e.date) continue;
    const y = Number(e.date.slice(0, 4));
    (byYear.get(y) ?? byYear.set(y, []).get(y)!).push({
      date: e.date,
      amount: e.amount,
      bookId: e.bookId,
    });
  }
  let cur = 0;
  let earned: string | null = null;
  for (const list of byYear.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    const seen = new Set<string>();
    let running = 0;
    let crossed: string | null = null;
    for (const e of list) {
      if (seen.has(e.bookId)) continue; // releitura no mesmo ano não duplica
      seen.add(e.bookId);
      running += e.amount;
      if (!crossed && running >= goal) crossed = e.date;
    }
    cur = Math.max(cur, running);
    if (crossed && (!earned || crossed < earned)) earned = crossed;
  }
  return { cur, earned };
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Máximo de eventos numa janela deslizante de N dias + data em que atingiu o alvo. */
function windowReach(
  dates: string[],
  windowDays: number,
  goal: number,
): { cur: number; earned: string | null } {
  const sorted = [...dates].sort();
  let cur = 0;
  let earned: string | null = null;
  for (let i = 0; i < sorted.length; i++) {
    const end = addDaysISO(sorted[i], windowDays - 1);
    let count = 0;
    let reachedAt: string | null = null;
    for (let j = i; j < sorted.length && sorted[j] <= end; j++) {
      count++;
      if (count >= goal && !reachedAt) reachedAt = sorted[j];
    }
    if (count > cur) cur = count;
    if (reachedAt && (!earned || reachedAt < earned)) earned = reachedAt;
  }
  return { cur, earned };
}

function faltam(n: number, singular: string, plural = singular + "s"): string {
  const v = Math.max(0, n);
  return `${v.toLocaleString("pt-BR")} ${v === 1 ? singular : plural}`;
}

export async function getAchievements(userId: string): Promise<AchievementsData> {
  const supabase = await createClient();

  const [
    { data: readingsRaw },
    { data: quotesRaw },
    { data: logsRaw },
    { data: sessionsRaw },
    { data: seriesRaw },
  ] = await Promise.all([
    supabase
      .from("reading")
      .select(
        "id, start_date, finish_date, book:book_id(id, pages, language, created_at, serie_id, book_author(author(id, country)))",
      )
      .eq("user_id", userId)
      .eq("status", "finished"),
    supabase.from("quote").select("created_at").eq("user_id", userId),
    supabase
      .from("reading_progress_log")
      .select("log_date, pages_delta")
      .eq("user_id", userId),
    supabase.from("reading_session").select("started_at").eq("user_id", userId),
    supabase
      .from("serie")
      .select("id, name, status, qty_volumes, finish_date")
      .eq("user_id", userId),
  ]);

  const readings = (readingsRaw as unknown as ReadingRow[] | null) ?? [];
  const quotes = (quotesRaw as { created_at: string }[] | null) ?? [];
  const logs = (logsRaw as { log_date: string; pages_delta: number }[] | null) ?? [];
  const sessions = (sessionsRaw as { started_at: string }[] | null) ?? [];
  const series = (seriesRaw as unknown as SerieRow[] | null) ?? [];

  // ---- Exploração ----
  const countryEvents = readings.map((r) => ({
    date: r.finish_date,
    keys: [
      ...new Set(
        (r.book?.book_author ?? [])
          .map((ba) => ba.author?.country)
          .filter((c): c is Country => !!c),
      ),
    ] as string[],
  }));
  const countryReach = distinctReach(countryEvents, 20);

  const continentEvents = readings.map((r) => ({
    date: r.finish_date,
    keys: [
      ...new Set(
        (r.book?.book_author ?? [])
          .map((ba) => ba.author?.country)
          .filter((c): c is Country => !!c)
          .map((c) => CONTINENT[c]),
      ),
    ],
  }));
  const continentReach = distinctReach(continentEvents, 6);

  const langEvents = readings.map((r) => ({
    date: r.finish_date,
    keys: r.book?.language ? [r.book.language] : [],
  }));
  const langReach = distinctReach(langEvents, 5);

  // ---- Volume ----
  const pageEvents = readings
    .filter((r) => r.book)
    .map((r) => ({
      date: r.finish_date,
      amount: r.book!.pages ?? 0,
      bookId: r.book!.id,
    }));
  const pagesYear = yearlyReach(pageEvents, 10000);

  const bookEvents = readings
    .filter((r) => r.book)
    .map((r) => ({ date: r.finish_date, amount: 1, bookId: r.book!.id }));
  const booksYear = yearlyReach(bookEvents, 50);

  // páginas num único dia (soma dos deltas por data)
  const byDay = new Map<string, number>();
  for (const l of logs) {
    byDay.set(l.log_date, (byDay.get(l.log_date) ?? 0) + (l.pages_delta ?? 0));
  }
  let maxDayPages = 0;
  let maxDayDate: string | null = null;
  for (const [day, sum] of byDay) {
    if (sum > maxDayPages) {
      maxDayPages = sum;
      maxDayDate = day;
    }
  }
  const dayEarned = maxDayPages >= 1000 ? maxDayDate : null;

  // ---- Ritmo ----
  // Maratonista: livros distintos por primeira data de conclusão.
  const firstFinish = new Map<string, string>();
  for (const r of readings) {
    if (!r.book || !r.finish_date) continue;
    const prev = firstFinish.get(r.book.id);
    if (!prev || r.finish_date < prev) firstFinish.set(r.book.id, r.finish_date);
  }
  const maratona = windowReach([...firstFinish.values()], 7, 3);

  const sessionDates = sessions.map((s) => s.started_at.slice(0, 10));
  const folego = windowReach(sessionDates, 7, 5);

  // ---- Curadoria ----
  const authorEvents = readings.map((r) => ({
    date: r.finish_date,
    keys: [
      ...new Set(
        (r.book?.book_author ?? [])
          .map((ba) => ba.author?.id)
          .filter((id): id is string => !!id),
      ),
    ],
  }));
  const authorReach = distinctReach(authorEvents, 40);

  const quoteDates = quotes
    .map((q) => q.created_at.slice(0, 10))
    .sort();
  const quotesCur = quoteDates.length;
  const quotesEarned = quotesCur >= 100 ? quoteDates[99] : null;

  // Série completa: séries com todos os volumes lidos ou marcadas como finalizadas.
  const finishedBySerie = new Map<string, Set<string>>();
  for (const r of readings) {
    const sid = r.book?.serie_id;
    if (!sid || !r.book) continue;
    (finishedBySerie.get(sid) ?? finishedBySerie.set(sid, new Set()).get(sid)!).add(
      r.book.id,
    );
  }
  let serieUnlocked = false;
  let serieEarned: string | null = null;
  let bestSerie: { name: string; read: number; qty: number } | null = null;
  for (const s of series) {
    const read = finishedBySerie.get(s.id)?.size ?? 0;
    const qty = s.qty_volumes ?? 0;
    const complete = s.status === "finished" || (qty > 0 && read >= qty);
    if (complete) {
      serieUnlocked = true;
      if (s.finish_date && (!serieEarned || s.finish_date < serieEarned)) {
        serieEarned = s.finish_date;
      }
    } else if (qty > 0) {
      if (!bestSerie || read / qty > bestSerie.read / bestSerie.qty) {
        bestSerie = { name: s.name, read, qty };
      }
    }
  }

  // ---- Redescoberta ----
  // Desenterrada: livro que ficou +1 ano no acervo antes de ser lido.
  let desenterradaEarned: string | null = null;
  for (const r of readings) {
    if (!r.book) continue;
    const readAt = r.start_date ?? r.finish_date;
    if (!readAt) continue;
    const added = r.book.created_at.slice(0, 10);
    const gapMs = new Date(readAt).getTime() - new Date(added).getTime();
    if (gapMs > 365 * 24 * 3600 * 1000) {
      const when = r.finish_date ?? readAt;
      if (!desenterradaEarned || when < desenterradaEarned) desenterradaEarned = when;
    }
  }

  // ---- montagem ----
  const mk = (
    key: string,
    name: string,
    desc: string,
    glyph: string,
    cur: number,
    goal: number,
    earned: string | null,
    hint: string,
    unlockedOverride?: boolean,
  ): Achievement => {
    const unlocked = unlockedOverride ?? cur >= goal;
    return {
      key,
      name,
      desc,
      glyph,
      cur,
      goal,
      unlocked,
      earned: unlocked ? earned : null,
      hint: unlocked ? null : hint,
    };
  };

  const serieHint = bestSerie
    ? `${bestSerie.read} de ${bestSerie.qty} volumes · ${bestSerie.name}`
    : "nenhuma série em andamento";

  const categories: AchievementCategory[] = [
    {
      name: "Exploração",
      color: "#2C5078",
      items: [
        mk(
          "volta-ao-mundo",
          "Volta ao mundo",
          "Um livro de cada continente",
          "globe",
          continentReach.cur,
          6,
          continentReach.earned,
          `faltam ${faltam(6 - continentReach.cur, "continente")}`,
        ),
        mk(
          "poliglota",
          "Poliglota",
          "Leu em 5 idiomas diferentes",
          "langs",
          langReach.cur,
          5,
          langReach.earned,
          `faltam ${faltam(5 - langReach.cur, "idioma")}`,
        ),
        mk(
          "cartografa",
          "Cartógrafa",
          "20 países de autor visitados",
          "compass",
          countryReach.cur,
          20,
          countryReach.earned,
          `faltam ${faltam(20 - countryReach.cur, "país", "países")}`,
        ),
      ],
    },
    {
      name: "Volume",
      color: "#8C6E1C",
      items: [
        mk(
          "dez-mil-paginas",
          "Dez mil páginas",
          "10.000 páginas em um ano",
          "layers",
          pagesYear.cur,
          10000,
          pagesYear.earned,
          `recorde: ${pagesYear.cur.toLocaleString("pt-BR")} num ano`,
        ),
        mk(
          "devoradora",
          "Devoradora",
          "50 livros em um ano",
          "stack",
          booksYear.cur,
          50,
          booksYear.earned,
          `faltam ${faltam(50 - booksYear.cur, "livro")}`,
        ),
        mk(
          "clube-das-1000",
          "Clube das 1000",
          "1.000 páginas num único dia",
          "mountain",
          maxDayPages,
          1000,
          dayEarned,
          `recorde: ${maxDayPages.toLocaleString("pt-BR")}p num dia`,
        ),
      ],
    },
    {
      name: "Ritmo",
      color: "#9B4722",
      items: [
        mk(
          "maratonista",
          "Maratonista",
          "3 livros em uma semana",
          "flame",
          maratona.cur,
          3,
          maratona.earned,
          `recorde: ${maratona.cur} numa semana`,
        ),
        mk(
          "folego",
          "Fôlego",
          "5 sessões numa mesma semana",
          "wave",
          folego.cur,
          5,
          folego.earned,
          `faltam ${faltam(5 - folego.cur, "sessão", "sessões")}`,
        ),
      ],
    },
    {
      name: "Curadoria",
      color: "#7A4A6E",
      items: [
        mk(
          "constelacao-autores",
          "Constelação de autores",
          "40 autores diferentes",
          "stars",
          authorReach.cur,
          40,
          authorReach.earned,
          `faltam ${faltam(40 - authorReach.cur, "autor", "autores")}`,
        ),
        mk(
          "colecionadora-frases",
          "Colecionadora de frases",
          "100 citações salvas",
          "quote",
          quotesCur,
          100,
          quotesEarned,
          `faltam ${faltam(100 - quotesCur, "citação", "citações")}`,
        ),
        mk(
          "serie-completa",
          "Série completa",
          "Terminar uma série inteira",
          "links",
          bestSerie ? bestSerie.read : serieUnlocked ? 1 : 0,
          bestSerie ? bestSerie.qty : 1,
          serieEarned,
          serieHint,
          serieUnlocked,
        ),
      ],
    },
    {
      name: "Redescoberta",
      color: "#4A6B4E",
      items: [
        mk(
          "desenterrada",
          "Desenterrada",
          "Leu um livro parado há +1 ano",
          "sprout",
          desenterradaEarned ? 1 : 0,
          1,
          desenterradaEarned,
          "nenhum livro esperou +1 ano ainda",
          !!desenterradaEarned,
        ),
      ],
    },
  ];

  let unlockedCount = 0;
  let totalCount = 0;
  for (const c of categories)
    for (const a of c.items) {
      totalCount++;
      if (a.unlocked) unlockedCount++;
    }

  return { categories, unlockedCount, totalCount };
}
