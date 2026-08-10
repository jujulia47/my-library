import { createClient } from "@/utils/supabase/server";

/** Ordem canônica dos campos verificados (bibliográficos + país do autor). */
export const HEALTH_FIELDS = [
  "título",
  "autor",
  "ISBN",
  "idioma",
  "páginas",
  "editora",
  "ano de publicação",
  "título original",
  "capa",
  "sinopse",
  "gênero",
  "país do autor",
  "data de aquisição",
] as const;

export type HealthField = (typeof HEALTH_FIELDS)[number];

export type IncompleteBook = {
  id: string;
  title: string;
  slug: string;
  cover: string | null;
  author: string | null;
  missing: HealthField[];
};

export type DataHealthData = {
  books: IncompleteBook[];
  totalBooks: number;
  completeBooks: number;
  /** Quantos livros faltam cada campo (pra resumo/atalho de filtro). */
  fieldCounts: { field: HealthField; count: number }[];
};

type Row = {
  id: string;
  title: string | null;
  slug: string;
  cover: string | null;
  isbn: string | null;
  language: string | null;
  pages: number | null;
  publisher: string | null;
  publication_year: number | null;
  original_title: string | null;
  synopsis: string | null;
  acquired_at: string | null;
  book_author:
    | { author: { name: string | null; country: string | null } | null }[]
    | null;
  book_category: { id: string }[] | null;
};

const empty = (s: string | null | undefined) => !s || s.trim() === "";

export async function getDataHealth(userId: string): Promise<DataHealthData> {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("book")
    .select(
      "id, title, slug, cover, isbn, language, pages, publisher, publication_year, original_title, synopsis, acquired_at, book_author(author(name, country)), book_category(id)",
    )
    .eq("user_id", userId);

  const rows = (raw as unknown as Row[] | null) ?? [];

  const books: IncompleteBook[] = [];
  const counts = new Map<HealthField, number>();
  const bump = (f: HealthField) => counts.set(f, (counts.get(f) ?? 0) + 1);

  for (const b of rows) {
    const authors = b.book_author ?? [];
    const hasAuthor = authors.some((ba) => ba.author);
    const hasCountry = authors.some((ba) => ba.author?.country);

    const missing: HealthField[] = [];
    if (empty(b.title)) missing.push("título");
    if (!hasAuthor) missing.push("autor");
    if (empty(b.isbn)) missing.push("ISBN");
    if (!b.language) missing.push("idioma");
    if (b.pages == null || b.pages <= 0) missing.push("páginas");
    if (empty(b.publisher)) missing.push("editora");
    if (b.publication_year == null) missing.push("ano de publicação");
    if (empty(b.original_title)) missing.push("título original");
    if (empty(b.cover)) missing.push("capa");
    if (empty(b.synopsis)) missing.push("sinopse");
    if ((b.book_category ?? []).length === 0) missing.push("gênero");
    if (hasAuthor && !hasCountry) missing.push("país do autor");
    if (empty(b.acquired_at)) missing.push("data de aquisição");

    if (missing.length === 0) continue;
    for (const f of missing) bump(f);

    books.push({
      id: b.id,
      title: b.title ?? "(sem título)",
      slug: b.slug,
      cover: b.cover,
      author: authors.find((ba) => ba.author?.name)?.author?.name ?? null,
      missing,
    });
  }

  // Mais incompletos primeiro; desempate por título.
  books.sort(
    (a, z) =>
      z.missing.length - a.missing.length ||
      a.title.localeCompare(z.title, "pt-BR"),
  );

  const fieldCounts = HEALTH_FIELDS.map((field) => ({
    field,
    count: counts.get(field) ?? 0,
  })).filter((f) => f.count > 0);

  return {
    books,
    totalBooks: rows.length,
    completeBooks: rows.length - books.length,
    fieldCounts,
  };
}
