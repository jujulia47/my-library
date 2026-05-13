import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";
import {
  deriveLastActivity,
  type LastActivity,
} from "@/services/serieLastActivity";

type SerieRow = Database["public"]["Tables"]["serie"]["Row"];
type BookRow = Database["public"]["Tables"]["book"]["Row"];
type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];
type ReadingEventRow = Database["public"]["Tables"]["reading_event"]["Row"];
type SerieStatus = Database["public"]["Enums"]["serie_status"];

const SERIE_STATUSES: SerieStatus[] = [
  "tbr",
  "reading",
  "paused",
  "finished",
  "abandoned",
];

export type SerieListSort =
  | "reading_first"
  | "name_asc"
  | "name_desc"
  | "last_activity_desc"
  | "started_asc"
  | "qty_volumes_asc"
  | "qty_volumes_desc";

/**
 * Item de listagem da série, com dados agregados em memória.
 *
 * - `books` é a lista de livros da série, ordenada por `volume asc nulls last`.
 * - `authors` são os autores distintos derivados dos livros (concatenados na UI).
 * - `read_count` é o número de livros com pelo menos uma reading em status
 *   "finished".
 * - `last_activity` é o MAX(reading.updated_at) das readings de qualquer livro
 *   da série. Reflete a interação mais recente do usuário (mudou status, página,
 *   rating, etc.) — não só transições de data. Usado pra UI ("há 5 dias")
 *   e sort "last_activity_desc".
 * - `first_started_at` é o MIN(start_date) das readings — alimenta sort.
 */
export type SerieListItem = SerieRow & {
  books: SerieListBook[];
  authors: string[];
  read_count: number;
  last_activity: string | null;
  first_started_at: string | null;
  /** Última atividade caracterizada (event vs update) — derivada via
   *  `deriveLastActivity`. Null se a série não tem leituras. */
  last_activity_detail: LastActivity | null;
};

export type SerieListReading = Pick<
  ReadingRow,
  "status" | "start_date" | "finish_date" | "current_page" | "rating" | "updated_at"
> & {
  events: Pick<ReadingEventRow, "event_type" | "created_at">[];
};

export type SerieListBook = Pick<
  BookRow,
  "id" | "slug" | "title" | "cover" | "volume"
> & {
  readings: SerieListReading[];
  authors: string[];
};

type RawBook = Pick<BookRow, "id" | "slug" | "title" | "cover" | "volume"> & {
  book_author?: { author: { name: string } | null }[] | null;
  reading?:
    | (ReadingRow & {
        reading_event?:
          | Pick<ReadingEventRow, "event_type" | "created_at">[]
          | null;
      })[]
    | null;
};

type RawSerie = SerieRow & {
  book?: RawBook[] | null;
};

export type SerieListParams = {
  statuses?: string[];
  /** "not_started" | "in_progress" | "completed" — derivado de read_count vs qty_volumes */
  progress?: string[];
  /** Filtro nominal — slugs das séries a manter. Vazio/undefined = todas. */
  serie_slugs?: string[];
  sort?: SerieListSort;
};

function flatten(raw: RawSerie): SerieListItem {
  const books = (raw.book ?? []).map((b): SerieListBook => {
    const authors = (b.book_author ?? [])
      .map((ba) => ba.author?.name)
      .filter((n): n is string => !!n);
    const readings = (b.reading ?? []).map((r) => ({
      status: r.status,
      start_date: r.start_date,
      finish_date: r.finish_date,
      current_page: r.current_page,
      rating: r.rating,
      updated_at: r.updated_at,
      events: (r.reading_event ?? []).map((ev) => ({
        event_type: ev.event_type,
        created_at: ev.created_at,
      })),
    }));
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      cover: b.cover,
      volume: b.volume,
      readings,
      authors,
    };
  });

  // Ordena por volume asc com null no final.
  books.sort((a, b) => {
    if (a.volume == null && b.volume == null) return 0;
    if (a.volume == null) return 1;
    if (b.volume == null) return -1;
    return a.volume - b.volume;
  });

  // Autores distintos preservando ordem de aparição (volume asc).
  const seenAuthors = new Set<string>();
  const authors: string[] = [];
  for (const b of books) {
    for (const a of b.authors) {
      if (!seenAuthors.has(a)) {
        seenAuthors.add(a);
        authors.push(a);
      }
    }
  }

  let read_count = 0;
  let last_activity: string | null = null;
  let first_started_at: string | null = null;

  for (const b of books) {
    if (b.readings.some((r) => r.status === "finished")) read_count += 1;
    for (const r of b.readings) {
      if (r.start_date) {
        if (!first_started_at || r.start_date < first_started_at) {
          first_started_at = r.start_date;
        }
      }
      // last_activity = MAX(reading.updated_at) — reflete edições (ex: trocar
      // página atual sem mudar status) sem depender de event_date.
      if (
        r.updated_at &&
        (!last_activity || r.updated_at > last_activity)
      ) {
        last_activity = r.updated_at;
      }
    }
  }

  // Última atividade detalhada — usa books JÁ flatten (com title/slug) +
  // events das readings.
  const last_activity_detail = deriveLastActivity(
    books.map((b) => ({
      title: b.title,
      slug: b.slug,
      readings: b.readings.map((r) => ({
        updated_at: r.updated_at ?? "",
        events: r.events ?? [],
      })),
    })),
  );

  return {
    ...raw,
    books,
    authors,
    read_count,
    last_activity,
    first_started_at,
    last_activity_detail,
  };
}

/**
 * Lista séries com livros + readings aninhados pra renderizar carrossel +
 * progresso. Sorts derivados (last_activity, started) são feitos em memória.
 *
 * Filtro `statuses`: nativo (`serie.status IN [...]`).
 * Filtro `progress`: derivado — `not_started` (read_count=0), `in_progress`
 * (0 < read_count < qty_volumes ou qty_volumes null mas há leitura), `completed`
 * (qty_volumes != null && read_count >= qty_volumes).
 *
 * TODO: para muitas séries com muitos livros, considerar view materializada
 * com counts (mesmo TODO de bookList.ts).
 */
export async function serieListQuery(
  params: SerieListParams = {},
): Promise<SerieListItem[]> {
  const supabase = await createClient();
  const sort = params.sort ?? "reading_first";

  let query = supabase
    .from("serie")
    .select(
      `*, book!book_serie_id_fkey(id, slug, title, cover, volume, book_author(author(name)), reading(*, reading_event(event_type, created_at)))`,
    );

  const validStatuses = (params.statuses ?? []).filter(
    (s): s is SerieStatus => SERIE_STATUSES.includes(s as SerieStatus),
  );
  if (validStatuses.length === 1) {
    query = query.eq("status", validStatuses[0]);
  } else if (validStatuses.length > 1) {
    query = query.in("status", validStatuses);
  }

  // Filtro nominal por slug — quando setado, ignora todas as outras séries.
  const serieSlugs = (params.serie_slugs ?? []).filter(
    (s): s is string => !!s,
  );
  if (serieSlugs.length === 1) {
    query = query.eq("slug", serieSlugs[0]);
  } else if (serieSlugs.length > 1) {
    query = query.in("slug", serieSlugs);
  }

  // Sort nativo só vale pra colunas. Os derivados ordenam em memória.
  if (sort === "name_asc") query = query.order("name", { ascending: true });
  else if (sort === "name_desc")
    query = query.order("name", { ascending: false });
  else if (sort === "qty_volumes_asc")
    query = query.order("qty_volumes", { ascending: true, nullsFirst: false });
  else if (sort === "qty_volumes_desc")
    query = query.order("qty_volumes", { ascending: false, nullsFirst: false });

  const { data, error } = await query;
  if (error) return [];

  let series = (data ?? []).map((row) => flatten(row as RawSerie));

  const progressSet = new Set(params.progress ?? []);
  if (progressSet.size > 0) {
    series = series.filter((s) => {
      const total = s.qty_volumes;
      const read = s.read_count;
      const hasAnyReading = s.books.some((b) => b.readings.length > 0);
      if (progressSet.has("not_started") && read === 0 && !hasAnyReading)
        return true;
      if (
        progressSet.has("in_progress") &&
        ((total != null && read > 0 && read < total) ||
          (total == null && hasAnyReading && read < s.books.length))
      )
        return true;
      if (progressSet.has("completed") && total != null && read >= total)
        return true;
      return false;
    });
  }

  if (sort === "last_activity_desc") {
    series = series.slice().sort((a, b) => {
      const ad = a.last_activity ?? "";
      const bd = b.last_activity ?? "";
      return bd.localeCompare(ad);
    });
  } else if (sort === "started_asc") {
    series = series.slice().sort((a, b) => {
      const ad = a.first_started_at ?? "9999";
      const bd = b.first_started_at ?? "9999";
      return ad.localeCompare(bd);
    });
  } else if (sort === "reading_first") {
    // Séries com volumes pendentes (não completas) no topo, ordenadas por
    // last_activity desc. Séries concluídas/abandonadas no fim, também por
    // last_activity. Cobre o caso "estou no meio dessas séries" — o que o
    // user quer ver primeiro.
    const isIncomplete = (s: SerieListItem): boolean => {
      // Status explícito reading/paused → sempre conta como incompleta.
      if (s.status === "reading" || s.status === "paused") return true;
      // Status tbr/finished/abandoned: deriva do progresso. tbr com leituras
      // (ex.: user começou mas não atualizou o status) também conta.
      const total = s.qty_volumes;
      if (total != null && total > 0) return s.read_count < total;
      // Sem total declarado: incompleta se há leitura em andamento entre os
      // livros cadastrados.
      return s.books.some((b) =>
        b.readings.some(
          (r) => r.status === "reading" || r.status === "paused",
        ),
      );
    };

    series = series.slice().sort((a, b) => {
      const ai = isIncomplete(a) ? 0 : 1;
      const bi = isIncomplete(b) ? 0 : 1;
      if (ai !== bi) return ai - bi;
      const ad = a.last_activity ?? "";
      const bd = b.last_activity ?? "";
      if (ad !== bd) return bd.localeCompare(ad);
      return a.name.localeCompare(b.name);
    });
  }

  return series;
}

export async function serieCounts() {
  const supabase = await createClient();
  const { count: total } = await supabase
    .from("serie")
    .select("id", { count: "exact", head: true });
  return { total: total ?? 0 };
}
