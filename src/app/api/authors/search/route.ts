import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";

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
    .from("author")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true })
    .limit(8);

  if (q) {
    // Match accent + case insensitive via name_normalized (sessão 12).
    const nq = normalizeSearchQuery(q).replace(/[%_]/g, " ");
    query = query.ilike("name_normalized", `%${nq}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ authors: data ?? [] });
}
