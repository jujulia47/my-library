import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

type BookRow = Database["public"]["Tables"]["book"]["Row"];
type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type BookFormat = Database["public"]["Enums"]["book_format"];

export type LegacyStatus = ReadingStatus | "tbr" | "wont_read";

export type BookListSort =
  | "reading_first"
  | "title_asc"
  | "title_desc"
  | "created_desc"
  | "last_reading_desc"
  | "acquired_asc";

export type BookListItem = BookRow & {
  authors: string[];
  reading: ReadingRow[];
  latest_reading: Pick<
    ReadingRow,
    "status" | "start_date" | "finish_date" | "current_page" | "rating"
  > | null;
};

type RawBookFromQuery = BookRow & {
  book_author?: { author: { name: string } | null }[] | null;
  reading?: ReadingRow[] | null;
};

const READING_STATUSES: ReadingStatus[] = [
  "reading",
  "paused",
  "finished",
  "abandoned",
];
// Grupos lógicos exibidos no filtro de "Posse" — cada grupo expande pra um
// conjunto de `ownership_status`. UI passa as chaves de grupo; o service
// expande aqui. Mantém o vocabulário do user separado do schema do banco.
const OWNERSHIP_GROUPS: Record<string, OwnershipStatus[]> = {
  na_estante: ["owned"], // + tem que ter formato físico (checado abaixo)
  doado_vendido: ["donated", "sold", "traded"],
  emprestado: ["lent_out", "borrowed"],
  perdido: ["lost"],
  // `fora_estante` é tratado como negação em memória (não cabe num IN list).
};
const OWNERSHIP_OUT_OF_SHELF = "fora_estante";
const FORMATS: BookFormat[] = ["physical", "ebook", "audiobook"];

export const ALL_STATUS_VALUES: LegacyStatus[] = [
  ...READING_STATUSES,
  "tbr",
  "wont_read",
];

function flatten(raw: RawBookFromQuery): BookListItem {
  const authors =
    raw.book_author
      ?.map((ba) => ba.author?.name)
      .filter((n): n is string => !!n) ?? [];

  const sorted = (raw.reading ?? []).slice().sort((a, b) => {
    const af = a.finish_date ?? "";
    const bf = b.finish_date ?? "";
    if (af !== bf) return bf.localeCompare(af);
    const as = a.start_date ?? "";
    const bs = b.start_date ?? "";
    return bs.localeCompare(as);
  });

  return {
    ...raw,
    authors,
    reading: raw.reading ?? [],
    latest_reading: sorted[0]
      ? {
          status: sorted[0].status,
          start_date: sorted[0].start_date,
          finish_date: sorted[0].finish_date,
          current_page: sorted[0].current_page,
          rating: sorted[0].rating,
        }
      : null,
  };
}

export type BookListParams = {
  statuses?: string[];
  ownerships?: string[];
  formats?: string[];
  /** Slugs dos autores a filtrar — livro precisa ter pelo menos um deles. */
  author_slugs?: string[];
  year?: number;
  month?: number;
  /** Quando true, lista só livros marcados como favoritos. */
  favorite?: boolean;
  sort?: BookListSort;
};

/**
 * Lista livros com filtros multi-valor combinados:
 *   AND entre grupos, OR dentro do grupo.
 *
 * - `statuses`: leitura mais recente em [valores]; "tbr" = livros sem reading.
 * - `ownerships`: book.ownership_status IN [valores].
 * - `formats`: book.formats_owned && [valores] (ANY overlap).
 * - `year` / `month`: livro tem ALGUMA reading com status=finished cuja
 *   finish_date cai no ano (e mês opcional). Se month sem year, ignora month.
 *
 * O grupo "statuses" precisa de UNION lógico entre "está em [reading|paused|
 * finished|abandoned]" (último reading) e "tbr" (sem nenhum reading). Como
 * isso depende da última reading, é resolvido em memória depois do flatten.
 *
 * Filtros que mapeiam direto a colunas (`ownerships`, `formats`) usam
 * Postgres. Os derivados (`statuses`, `year/month`) ficam em memória — caso
 * suba pra escala, criar `book_with_meta` view materializada.
 */
export async function bookListQuery(
  params: BookListParams = {},
): Promise<BookListItem[]> {
  const supabase = await createClient();
  const sort = params.sort ?? "reading_first";

  let query = supabase
    .from("book")
    .select(`*, book_author(author(name)), reading(*)`);

  // Ownerships: grupos vindos da UI. Quando há `fora_estante` na lista, o
  // filtro vira "NOT (owned + physical)" — não cabe em IN/EQ, então cai pra
  // memória depois do fetch. Quando só há grupos "positivos", expandimos pros
  // ownership_status correspondentes e usamos IN nativo do PostgREST.
  const ownershipsParam = params.ownerships ?? [];
  const wantsOutOfShelf = ownershipsParam.includes(OWNERSHIP_OUT_OF_SHELF);
  const positiveGroups = ownershipsParam.filter(
    (g) => g !== OWNERSHIP_OUT_OF_SHELF && OWNERSHIP_GROUPS[g],
  );

  if (!wantsOutOfShelf && positiveGroups.length > 0) {
    const expanded = [
      ...new Set(positiveGroups.flatMap((g) => OWNERSHIP_GROUPS[g])),
    ];
    if (expanded.length === 1) {
      query = query.eq("ownership_status", expanded[0]);
    } else if (expanded.length > 1) {
      query = query.in("ownership_status", expanded);
    }
    // "Na estante" sozinho exige formato físico — sem isso, kindle/audible
    // "owned" entrariam no resultado. Aplica só quando `na_estante` é o
    // único grupo (com mais grupos, IN já cobre o restante e não dá pra
    // restringir physical sem excluir os outros).
    if (positiveGroups.length === 1 && positiveGroups[0] === "na_estante") {
      query = query.overlaps("formats_owned", ["physical"]);
    }
  }

  // Formats: array overlap com `&&`. Valor especial "none" = livro sem
  // nenhum formato definido (`formats_owned` null ou array vazio) — pra
  // achar registros incompletos. Combina via OR com formatos reais.
  const rawFormats = params.formats ?? [];
  const wantsNoFormat = rawFormats.includes("none");
  const validFormats = rawFormats.filter(
    (f): f is BookFormat => FORMATS.includes(f as BookFormat),
  );
  if (wantsNoFormat && validFormats.length > 0) {
    // Cada formato vira sua própria condição `ov.{x}` (array de 1 elemento,
    // sem vírgula interna — a vírgula no `.or()` é separador de condição).
    const ovConds = validFormats
      .map((f) => `formats_owned.ov.{${f}}`)
      .join(",");
    query = query.or(
      `formats_owned.is.null,formats_owned.eq.{},${ovConds}`,
    );
  } else if (wantsNoFormat) {
    query = query.or("formats_owned.is.null,formats_owned.eq.{}");
  } else if (validFormats.length > 0) {
    query = query.overlaps("formats_owned", validFormats);
  }

  // Favoritos: filtro nativo booleano.
  if (params.favorite) {
    query = query.eq("is_favorite", true);
  }

  // Filtro por autor: pré-consulta `book_author` pra obter book_ids dos
  // autores selecionados. Aplica `query.in("id", bookIds)` em seguida.
  // Vazio (nenhum livro daqueles autores) → garante resultado vazio
  // imediatamente sem ir pro Postgres.
  const authorSlugs = (params.author_slugs ?? []).filter(
    (s): s is string => !!s,
  );
  if (authorSlugs.length > 0) {
    const { data: authorRows } = await supabase
      .from("author")
      .select("id")
      .in("slug", authorSlugs);
    const authorIds = (authorRows ?? []).map((a) => a.id);
    if (authorIds.length === 0) return [];
    const { data: linkRows } = await supabase
      .from("book_author")
      .select("book_id")
      .in("author_id", authorIds);
    const matchingBookIds = [
      ...new Set((linkRows ?? []).map((r) => r.book_id)),
    ];
    if (matchingBookIds.length === 0) return [];
    query = query.in("id", matchingBookIds);
  }

  // Sort nativo — respeita a coluna pedida pura. "Título (A-Z)" é A-Z de
  // verdade: sem boost de favoritos (que quebrava a expectativa do user de
  // ordenação alfabética simples quando escolhe esse sort explicitamente).
  if (sort === "title_asc") {
    query = query.order("title", { ascending: true });
  } else if (sort === "title_desc") {
    query = query.order("title", { ascending: false });
  } else if (sort === "created_desc") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "acquired_asc") {
    // Migrado de `acquisition_date` (sessão 15.2) — campo dropado.
    query = query.order("acquired_at", {
      ascending: true,
      nullsFirst: false,
    });
  }

  const { data, error } = await query;
  if (error) return [];

  let books = (data ?? []).map((row) => flatten(row as RawBookFromQuery));

  // Ownership: filtro em memória quando `fora_estante` foi pedido. Tem que
  // ser aqui (não na query) porque é uma NEGAÇÃO composta (não-owned OU
  // owned-sem-físico). Quando combinado com grupos positivos, faz OR entre
  // eles — "Fora da estante OU Emprestado" mostra ambos. "Fora da estante OU
  // Na estante" cobre tudo (no-op).
  if (wantsOutOfShelf) {
    const positiveStatuses = new Set(
      positiveGroups.flatMap((g) => OWNERSHIP_GROUPS[g]),
    );
    const wantsNaEstanteToo = positiveGroups.includes("na_estante");
    books = books.filter((b) => {
      const status = b.ownership_status;
      const hasPhysical = (b.formats_owned ?? []).includes("physical");
      const isOnShelf = status === "owned" && hasPhysical;
      if (!isOnShelf) return true; // satisfaz fora_estante
      if (wantsNaEstanteToo) return true; // OR com na_estante = aceita
      // Caso de borda: positiveGroups poderia incluir 'owned' por outro
      // grupo (não existe hoje, mas defensivo). Em geral, na_estante é o
      // único grupo que contém 'owned'.
      return positiveStatuses.has(status);
    });
  }

  // Statuses: união entre leitura mais recente e "tbr".
  const requested = (params.statuses ?? []).filter((s): s is LegacyStatus =>
    (ALL_STATUS_VALUES as readonly string[]).includes(s),
  );
  if (requested.length > 0) {
    const wantsTbr = requested.includes("tbr");
    const wantsWontRead = requested.includes("wont_read");
    const readingSet = new Set(
      requested.filter((s): s is ReadingStatus =>
        READING_STATUSES.includes(s as ReadingStatus),
      ),
    );
    books = books.filter((b) => {
      const last = b.latest_reading?.status as ReadingStatus | undefined;
      if (last && readingSet.has(last)) return true;
      // TBR explícito (flag `is_tbr`): entra na lista independente do
      // histórico — cobre "livro já lido que quero reler".
      if (wantsTbr && b.is_tbr) return true;
      // Sem leitura registrada: TBR derivado (default). Distingue "não vou
      // ler" (flag wont_read) de "quero ler" pela coluna `wont_read`.
      if (b.reading.length === 0) {
        if (wantsWontRead && b.wont_read) return true;
        if (wantsTbr && !b.wont_read) return true;
      }
      return false;
    });
  }

  // Período: alguma reading finished no ano (e mês opcional).
  if (params.year) {
    const year = params.year;
    const month = params.month && params.month >= 1 && params.month <= 12
      ? params.month
      : null;
    books = books.filter((b) =>
      b.reading.some((r) => {
        if (r.status !== "finished" || !r.finish_date) return false;
        const d = new Date(r.finish_date);
        if (d.getUTCFullYear() !== year) return false;
        if (month && d.getUTCMonth() + 1 !== month) return false;
        return true;
      }),
    );
  }

  if (sort === "last_reading_desc") {
    books = books.slice().sort((a, b) => {
      const ad = a.latest_reading?.finish_date ?? "";
      const bd = b.latest_reading?.finish_date ?? "";
      return bd.localeCompare(ad);
    });
  } else if (sort === "reading_first") {
    // Ordem: lendo → pausado → lido → quero ler (sem reading) → abandonado.
    // Abandonado SEMPRE vai por último — mesmo que tenha sido "última leitura"
    // recente, o user não quer ver na frente.
    const rank = (b: BookListItem): number => {
      const s = b.latest_reading?.status;
      if (s === "reading") return 0;
      if (s === "paused") return 1;
      if (s === "finished") return 2;
      if (s === "abandoned") return 4;
      return 3; // sem reading (tbr) ou outros
    };
    books = books.slice().sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      if (ra === 0 || ra === 1) {
        // Em curso: por start_date desc (quem começou mais recente primeiro).
        const ad = a.latest_reading?.start_date ?? "";
        const bd = b.latest_reading?.start_date ?? "";
        if (ad !== bd) return bd.localeCompare(ad);
      } else if (ra === 2 || ra === 4) {
        // Concluídos / abandonados: por finish_date desc (mais recente primeiro).
        const ad = a.latest_reading?.finish_date ?? "";
        const bd = b.latest_reading?.finish_date ?? "";
        if (ad !== bd) return bd.localeCompare(ad);
      }
      return a.title.localeCompare(b.title);
    });
  }

  return books;
}

export async function bookCounts() {
  const supabase = await createClient();
  // Total do header conta cada `book` cadastrado (inclui volumes que dividem
  // exemplar físico) — é o "acervo cadastrado". A contagem sem duplicados de
  // exemplar fica por conta de `countPhysicalCopies`, usada no filtro.
  const { count: totalCount } = await supabase
    .from("book")
    .select("id", { count: "exact", head: true });

  const { data: finishedReadings } = await supabase
    .from("reading")
    .select("book_id")
    .eq("status", "finished");
  const finishedBookIds = new Set(
    (finishedReadings ?? []).map((r) => r.book_id),
  );

  return { total: totalCount ?? 0, finished: finishedBookIds.size };
}

/**
 * Conta exemplares físicos numa lista de livros: volumes ligados por
 * `bundled_with` (omnibus / "mesmo exemplar de") representam um único livro
 * físico e contam como 1. Agrupa por componente conexo do grafo, restrito aos
 * livros presentes na própria lista — IDs bundled fora dela são ignorados.
 */
export function countPhysicalCopies(
  books: { id: string; bundled_with: string[] | null }[],
): number {
  const byId = new Map(books.map((b) => [b.id, b]));
  const seen = new Set<string>();
  let count = 0;
  for (const b of books) {
    if (seen.has(b.id)) continue;
    // BFS pelo grupo bundled — todo o componente conexo conta como 1 exemplar.
    const stack: string[] = [b.id];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (cur === undefined || seen.has(cur)) continue;
      seen.add(cur);
      for (const nb of byId.get(cur)?.bundled_with ?? []) {
        if (byId.has(nb) && !seen.has(nb)) stack.push(nb);
      }
    }
    count += 1;
  }
  return count;
}

/**
 * Lista os anos distintos em que existe alguma reading finalizada.
 * Usado pelo painel de filtros pra popular o dropdown de "Período".
 */
export async function yearsWithFinishedReadings(): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reading")
    .select("finish_date")
    .eq("status", "finished")
    .not("finish_date", "is", null);
  const years = new Set<number>();
  for (const row of data ?? []) {
    if (!row.finish_date) continue;
    const y = new Date(row.finish_date).getUTCFullYear();
    if (Number.isFinite(y)) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}
