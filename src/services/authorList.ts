import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";
import type { Database } from "@/utils/typings/supabase";

type AuthorRow = Database["public"]["Tables"]["author"]["Row"];
type Country = Database["public"]["Enums"]["country"];

export type AuthorListSort = "name_asc" | "books_desc" | "finished_desc" | "newest";

export type AuthorListParams = {
  search?: string;
  countries?: Country[];
  hasBooks?: boolean;
  sort?: AuthorListSort;
};

export type AuthorListItem = AuthorRow & {
  books_count: number;
  finished_count: number;
  quotes_count: number;
};

const VALID_SORTS = new Set<AuthorListSort>([
  "name_asc",
  "books_desc",
  "finished_desc",
  "newest",
]);

export function pickAuthorSort(raw: string | undefined): AuthorListSort {
  return VALID_SORTS.has(raw as AuthorListSort)
    ? (raw as AuthorListSort)
    : "name_asc";
}

export async function authorListQuery(
  params: AuthorListParams = {},
): Promise<AuthorListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const sort = params.sort ?? "name_asc";

  let query = supabase
    .from("author")
    .select(
      `*, book_author(book_id, book(reading(status)))`,
    )
    .eq("user_id", user.id);

  // Search via name_normalized (sessão 12)
  if (params.search?.trim()) {
    const term = normalizeSearchQuery(params.search).replace(/[%_]/g, " ");
    query = query.ilike("name_normalized", `%${term}%`);
  }

  // País multi-select nativo
  const countries = (params.countries ?? []).filter(
    (c): c is Country => typeof c === "string" && c.length > 0,
  );
  if (countries.length === 1) query = query.eq("country", countries[0]);
  else if (countries.length > 1) query = query.in("country", countries);

  // Sort nativo só pra name_asc / newest. Outros são derivados.
  if (sort === "name_asc") query = query.order("name", { ascending: true });
  else if (sort === "newest")
    query = query.order("created_at", { ascending: false });
  else query = query.order("name", { ascending: true });

  const { data, error } = await query;
  if (error) return [];

  type RawRow = AuthorRow & {
    book_author?: {
      book_id: string;
      book: { reading: { status: string }[] | null } | null;
    }[] | null;
  };

  // Lookup de quotes_count: 1 query agrupada pelos nomes dos autores retornados
  // (match por author_name) + linked via book_id (mas o linked já requer book
  // do autor, que pegamos via book_author).
  const authorRows = (data ?? []) as RawRow[];
  const authorIds = authorRows.map((a) => a.id);
  const authorNames = authorRows.map((a) => a.name);

  const [{ data: quoteByName }, { data: quoteByBook }] = await Promise.all([
    authorNames.length > 0
      ? supabase
          .from("quote")
          .select("id, author_name")
          .eq("user_id", user.id)
          .in("author_name", authorNames)
      : Promise.resolve({ data: [] as { id: string; author_name: string | null }[] }),
    authorIds.length > 0
      ? supabase
          .from("quote")
          .select("id, book_id, book:book_id(book_author(author_id))")
          .eq("user_id", user.id)
          .is("author_name", null)
          .not("book_id", "is", null)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const quotesByAuthorName = new Map<string, Set<string>>();
  for (const q of (quoteByName as { id: string; author_name: string | null }[]) ?? []) {
    if (!q.author_name) continue;
    const set = quotesByAuthorName.get(q.author_name) ?? new Set<string>();
    set.add(q.id);
    quotesByAuthorName.set(q.author_name, set);
  }
  const quotesByAuthorId = new Map<string, Set<string>>();
  for (const q of (quoteByBook as unknown as {
    id: string;
    book: { book_author?: { author_id: string }[] | null } | null;
  }[]) ?? []) {
    const ids = q.book?.book_author?.map((ba) => ba.author_id) ?? [];
    for (const aid of ids) {
      const set = quotesByAuthorId.get(aid) ?? new Set<string>();
      set.add(q.id);
      quotesByAuthorId.set(aid, set);
    }
  }

  let items: AuthorListItem[] = authorRows.map((row) => {
    const books = (row.book_author ?? [])
      .map((ba) => ba.book)
      .filter((b): b is { reading: { status: string }[] | null } => !!b);
    const books_count = books.length;
    const finished_count = books.filter((b) =>
      b.reading?.some((r) => r.status === "finished"),
    ).length;

    // Dedupe quotes — mesma quote pode aparecer pelos 2 caminhos
    const qIds = new Set<string>();
    const byName = quotesByAuthorName.get(row.name);
    if (byName) for (const id of byName) qIds.add(id);
    const byId = quotesByAuthorId.get(row.id);
    if (byId) for (const id of byId) qIds.add(id);

    return {
      ...row,
      books_count,
      finished_count,
      quotes_count: qIds.size,
    };
  });

  // Filtro hasBooks em memória
  if (params.hasBooks) {
    items = items.filter((a) => a.books_count > 0);
  }

  // Sort derivados
  if (sort === "books_desc") {
    items = items.slice().sort((a, b) => {
      if (a.books_count !== b.books_count) return b.books_count - a.books_count;
      return a.name.localeCompare(b.name, "pt-BR");
    });
  } else if (sort === "finished_desc") {
    items = items.slice().sort((a, b) => {
      if (a.finished_count !== b.finished_count)
        return b.finished_count - a.finished_count;
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }

  return items;
}

export async function authorCounts(): Promise<{
  total: number;
  with_books: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total: 0, with_books: 0 };

  const { count: total } = await supabase
    .from("author")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // with_books: distinct author_id em book_author
  const { data: links } = await supabase
    .from("book_author")
    .select("author_id")
    .eq("user_id", user.id);
  const withBooks = new Set((links ?? []).map((r) => r.author_id));

  return { total: total ?? 0, with_books: withBooks.size };
}

export async function authorCountriesAvailable(): Promise<Country[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("author")
    .select("country")
    .eq("user_id", user.id)
    .not("country", "is", null);
  const set = new Set<Country>();
  for (const r of data ?? []) {
    if (r.country) set.add(r.country);
  }
  return [...set];
}
