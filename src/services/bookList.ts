import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

type BookRow = Database["public"]["Tables"]["book"]["Row"];
type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type BookFormat = Database["public"]["Enums"]["book_format"];

export type LegacyStatus = ReadingStatus | "tbr";

export type BookListSort =
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
const OWNERSHIP_STATUSES: OwnershipStatus[] = [
  // Sessão 17.2 — 8 estados granulares (substituiu owned/disposed/lent/never_owned).
  "owned",
  "lent_out",
  "borrowed",
  "returned",
  "donated",
  "sold",
  "traded",
  "lost",
];
const FORMATS: BookFormat[] = ["physical", "ebook", "audiobook"];

export const ALL_STATUS_VALUES: LegacyStatus[] = [
  ...READING_STATUSES,
  "tbr",
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
  year?: number;
  month?: number;
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
  const sort = params.sort ?? "title_asc";

  let query = supabase
    .from("book")
    .select(`*, book_author(author(name)), reading(*)`);

  // Ownerships: filtro nativo.
  const validOwnerships = (params.ownerships ?? []).filter(
    (o): o is OwnershipStatus =>
      OWNERSHIP_STATUSES.includes(o as OwnershipStatus),
  );
  if (validOwnerships.length === 1) {
    query = query.eq("ownership_status", validOwnerships[0]);
  } else if (validOwnerships.length > 1) {
    query = query.in("ownership_status", validOwnerships);
  }

  // Formats: array overlap com `&&`. Postgrest exposes `overlaps`.
  const validFormats = (params.formats ?? []).filter(
    (f): f is BookFormat => FORMATS.includes(f as BookFormat),
  );
  if (validFormats.length > 0) {
    query = query.overlaps("formats_owned", validFormats);
  }

  // Sort nativo. Default `title_asc` ganha favoritos no topo (mesmo pattern de
  // collectionList "newest"). Os outros sorts respeitam a coluna pedida pura.
  if (sort === "title_asc") {
    query = query
      .order("is_favorite", { ascending: false })
      .order("title", { ascending: true });
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

  // Statuses: união entre leitura mais recente e "tbr".
  const requested = (params.statuses ?? []).filter((s): s is LegacyStatus =>
    (ALL_STATUS_VALUES as readonly string[]).includes(s),
  );
  if (requested.length > 0) {
    const wantsTbr = requested.includes("tbr");
    const readingSet = new Set(
      requested.filter((s): s is ReadingStatus =>
        READING_STATUSES.includes(s as ReadingStatus),
      ),
    );
    books = books.filter((b) => {
      const last = b.latest_reading?.status as ReadingStatus | undefined;
      if (last && readingSet.has(last)) return true;
      if (wantsTbr && b.reading.length === 0) return true;
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
  }

  return books;
}

export async function bookCounts() {
  const supabase = await createClient();
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
