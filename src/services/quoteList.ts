import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";
import type { Database } from "@/utils/typings/supabase";

type QuoteRow = Database["public"]["Tables"]["quote"]["Row"];
type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];

export type LegacyStatus = ReadingStatus | "tbr";

export type QuoteListSort = "newest" | "oldest" | "author_asc";

export type QuoteListType = "linked" | "standalone";

export type QuoteListItem = QuoteRow & {
  book: {
    id: string;
    slug: string;
    title: string;
    author: string | null;
    status: LegacyStatus;
  } | null;
  /** Atribuição final exibida no card. Para vinculadas, prefere `author_name`
   *  da quote, com fallback pro autor do livro. Para avulsas, somente
   *  `author_name` (sem fallback). */
  display_author: string | null;
};

type RawQuote = QuoteRow & {
  book?: {
    id: string;
    slug: string;
    title: string;
    book_author?: { author: { name: string } | null }[] | null;
    reading?: ReadingRow[] | null;
  } | null;
};

function deriveBookStatus(reading: ReadingRow[] | null | undefined): LegacyStatus {
  const sorted = (reading ?? []).slice().sort((a, b) => {
    const af = a.finish_date ?? "";
    const bf = b.finish_date ?? "";
    if (af !== bf) return bf.localeCompare(af);
    const as = a.start_date ?? "";
    const bs = b.start_date ?? "";
    return bs.localeCompare(as);
  });
  return sorted[0]?.status ?? "tbr";
}

function flatten(raw: RawQuote): QuoteListItem {
  let book: QuoteListItem["book"] = null;
  let bookAuthorJoined: string | null = null;
  if (raw.book) {
    const authors =
      raw.book.book_author
        ?.map((ba) => ba.author?.name)
        .filter((n): n is string => !!n) ?? [];
    bookAuthorJoined = authors.length ? authors.join(", ") : null;
    book = {
      id: raw.book.id,
      slug: raw.book.slug,
      title: raw.book.title,
      author: bookAuthorJoined,
      status: deriveBookStatus(raw.book.reading),
    };
  }

  const display_author = raw.author_name?.trim()
    ? raw.author_name.trim()
    : bookAuthorJoined;

  return {
    ...raw,
    book,
    display_author,
  };
}

export type QuoteListParams = {
  search?: string;
  types?: QuoteListType[];
  bookIds?: string[];
  authorNames?: string[];
  sort?: QuoteListSort;
};

/**
 * Lista citações com filtros combinados (AND entre grupos, OR dentro).
 *  - `search`: ilike no campo `text` (case-insensitive, parcial).
 *  - `types`: "linked" (book_id not null) e/ou "standalone" (book_id null).
 *  - `bookIds`: book_id IN [...] — implica linked, ignora standalone.
 *  - `authorNames`: author_name IN [...]. Match exato no campo da quote.
 *  - `sort`: newest|oldest|author_asc.
 *
 * Filtros nativos do Postgres onde possível; o resto resolve em memória após
 * o flatten (ex: quote.book.author_name vem do join, não da própria coluna).
 */
export async function quoteListQuery(
  params: QuoteListParams = {},
): Promise<QuoteListItem[]> {
  const supabase = await createClient();
  const sort = params.sort ?? "newest";

  let query = supabase
    .from("quote")
    .select(
      `*, book(id, slug, title, book_author(author(name)), reading(status, start_date, finish_date))`,
    );

  // Tipo: linked (book_id not null) / standalone (book_id null)
  const types = (params.types ?? []).filter((t): t is QuoteListType =>
    t === "linked" || t === "standalone",
  );
  if (types.length === 1) {
    if (types[0] === "linked") {
      query = query.not("book_id", "is", null);
    } else {
      query = query.is("book_id", null);
    }
  }
  // types.length === 0 ou 2 → não filtra

  // bookIds (apenas se não for filtro de tipo "standalone" sozinho)
  const bookIds = (params.bookIds ?? []).filter(Boolean);
  if (bookIds.length > 0) {
    if (bookIds.length === 1) {
      query = query.eq("book_id", bookIds[0]);
    } else {
      query = query.in("book_id", bookIds);
    }
  }

  // authorNames: match exato (inclui sentinela "__none__" pra "Sem atribuição")
  const authorNames = (params.authorNames ?? []).filter(Boolean);
  const wantsNoneAuthor = authorNames.includes("__none__");
  const concreteAuthors = authorNames.filter((a) => a !== "__none__");

  // Search accent + case insensitive via text_normalized (sessão 12).
  if (params.search?.trim()) {
    const term = normalizeSearchQuery(params.search).replace(/[%_]/g, " ");
    query = query.ilike("text_normalized", `%${term}%`);
  }

  // Sort nativo onde dá. Default `newest` ganha favoritos no topo.
  if (sort === "newest") {
    query = query
      .order("is_favorite", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  }
  // author_asc é resolvido em memória (o display_author é derivado)

  const { data, error } = await query;
  if (error) return [];

  let items = (data ?? []).map((row) => flatten(row as RawQuote));

  // authorNames: filtra em memória pra suportar fallback de autor do livro.
  // Convenção: match contra `display_author` (já considera fallback do book).
  if (authorNames.length > 0) {
    items = items.filter((q) => {
      if (wantsNoneAuthor && !q.display_author) return true;
      if (concreteAuthors.length > 0 && q.display_author) {
        return concreteAuthors.includes(q.display_author);
      }
      return false;
    });
  }

  if (sort === "author_asc") {
    items = items.slice().sort((a, b) => {
      const aa = (a.display_author ?? "").toLocaleLowerCase("pt-BR");
      const bb = (b.display_author ?? "").toLocaleLowerCase("pt-BR");
      // sem autor vai pro fim
      if (!aa && bb) return 1;
      if (aa && !bb) return -1;
      return aa.localeCompare(bb, "pt-BR");
    });
  }

  return items;
}

export async function quoteCounts() {
  const supabase = await createClient();
  const { count: total } = await supabase
    .from("quote")
    .select("id", { count: "exact", head: true });
  const { count: linked } = await supabase
    .from("quote")
    .select("id", { count: "exact", head: true })
    .not("book_id", "is", null);
  return {
    total: total ?? 0,
    linked: linked ?? 0,
    standalone: (total ?? 0) - (linked ?? 0),
  };
}

/** Livros que têm pelo menos uma citação — popula dropdown de filtro. */
export async function booksWithQuotes(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote")
    .select("book_id, book(id, title)")
    .not("book_id", "is", null);
  const map = new Map<string, string>();
  for (const row of (data ?? []) as { book_id: string | null; book: { id: string; title: string } | null }[]) {
    if (row.book?.id && row.book?.title) {
      map.set(row.book.id, row.book.title);
    }
  }
  return [...map.entries()]
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
}

/** Atribuições distintas (display_author) presentes nas quotes do user. */
export async function authorsInQuotes(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote")
    .select(
      `author_name, book(book_author(author(name)))`,
    );
  const set = new Set<string>();
  for (const row of (data ?? []) as {
    author_name: string | null;
    book: { book_author?: { author: { name: string } | null }[] | null } | null;
  }[]) {
    const direct = row.author_name?.trim();
    if (direct) {
      set.add(direct);
      continue;
    }
    const fallback = row.book?.book_author
      ?.map((ba) => ba.author?.name)
      .filter((n): n is string => !!n)
      .join(", ");
    if (fallback) set.add(fallback);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
