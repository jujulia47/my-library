import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";

export type WishlistForCollectionOption = {
  id: string;
  title: string;
  author_name: string | null;
  estimated_price: number | null;
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

  let excludedIds: string[] = [];
  if (excludeId) {
    const { data: existing } = await supabase
      .from("collection_item")
      .select("wishlist_id")
      .eq("collection_id", excludeId)
      .not("wishlist_id", "is", null);
    excludedIds = (existing ?? [])
      .map((r) => r.wishlist_id)
      .filter((id): id is string => !!id);
  }

  let query = supabase
    .from("wishlist")
    .select("id, title, author_name, estimated_price")
    .eq("user_id", user.id)
    .order("title", { ascending: true })
    .limit(8);
  if (q) {
    const nq = normalizeSearchQuery(q).replace(/[%_]/g, " ");
    query = query.ilike("title_normalized", `%${nq}%`);
  }
  if (excludedIds.length > 0) {
    query = query.not("id", "in", `(${excludedIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const items: WishlistForCollectionOption[] = (data ?? []).map((w) => ({
    id: w.id,
    title: w.title,
    author_name: w.author_name,
    estimated_price:
      w.estimated_price !== null
        ? typeof w.estimated_price === "string"
          ? Number(w.estimated_price)
          : w.estimated_price
        : null,
  }));
  return NextResponse.json({ items });
}
