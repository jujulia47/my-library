import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";

export type BookForCollectionOption = {
  id: string;
  title: string;
  cover: string | null;
  authors: string[];
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const excludeId = searchParams.get("exclude_collection_id");

  let excludedBookIds: string[] = [];
  if (excludeId) {
    const { data: existing } = await supabase
      .from("collection_item")
      .select("book_id")
      .eq("collection_id", excludeId)
      .not("book_id", "is", null);
    excludedBookIds = (existing ?? [])
      .map((r) => r.book_id)
      .filter((id): id is string => !!id);
  }

  let query = supabase
    .from("book")
    .select("id, title, cover, book_author(author(name))")
    .eq("user_id", user.id)
    .order("title", { ascending: true })
    .limit(8);
  if (q) {
    const nq = normalizeSearchQuery(q).replace(/[%_]/g, " ");
    query = query.ilike("title_normalized", `%${nq}%`);
  }
  if (excludedBookIds.length > 0) {
    query = query.not("id", "in", `(${excludedBookIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const books: BookForCollectionOption[] = (data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    cover: b.cover,
    authors:
      (b as unknown as { book_author?: { author: { name: string } | null }[] | null })
        .book_author?.map((ba) => ba.author?.name)
        .filter((n): n is string => !!n) ?? [],
  }));
  return NextResponse.json({ books });
}
