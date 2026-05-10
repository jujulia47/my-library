import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";

export type UnlinkedBookOption = {
  id: string;
  title: string;
  cover: string | null;
  publication_year: number | null;
  authors: string[];
};

/**
 * Lista livros do user atual que ainda não estão vinculados a nenhuma série
 * (`serie_id IS NULL`). Usado pelo modal "Vincular livro existente" da detail
 * page da série.
 *
 * `q`: match parcial case-insensitive sobre título OU sobre nome de autor
 * (via filtro com `or`). Limita a 8 resultados.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  let query = supabase
    .from("book")
    .select(
      "id, title, cover, publication_year, book_author(author(name))",
    )
    .eq("user_id", user.id)
    .is("serie_id", null)
    .order("title", { ascending: true })
    .limit(8);

  if (q) {
    // Match accent + case insensitive via title_normalized.
    // Match no autor exigiria join + or() com sub-tabela — fica de fora.
    const nq = normalizeSearchQuery(q).replace(/[%_]/g, " ");
    query = query.ilike("title_normalized", `%${nq}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    title: string;
    cover: string | null;
    publication_year: number | null;
    book_author?: { author: { name: string } | null }[] | null;
  };

  const books: UnlinkedBookOption[] = ((data ?? []) as Row[]).map((b) => ({
    id: b.id,
    title: b.title,
    cover: b.cover,
    publication_year: b.publication_year,
    authors: (b.book_author ?? [])
      .map((ba) => ba.author?.name)
      .filter((n): n is string => !!n),
  }));

  return NextResponse.json({ books });
}
