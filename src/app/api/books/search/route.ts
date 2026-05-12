import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";

export type BookSearchOption = {
  id: string;
  title: string;
  slug: string;
};

/**
 * Busca livros do usuário por título normalizado, retornando os campos
 * mínimos pra um picker de seleção (id + título + slug).
 *
 * Query params:
 *  - `q`: termo de busca (opcional — se vazio retorna os 8 primeiros).
 *  - `exclude_id`: ID a excluir do resultado (ex.: livro sendo editado).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const excludeId = searchParams.get("exclude_id");

  let query = supabase
    .from("book")
    .select("id, title, slug")
    .eq("user_id", user.id)
    .order("title", { ascending: true })
    .limit(10);

  if (q) {
    const nq = normalizeSearchQuery(q).replace(/[%_]/g, " ");
    query = query.ilike("title_normalized", `%${nq}%`);
  }
  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const books: BookSearchOption[] = (data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
  }));
  return NextResponse.json({ books });
}
