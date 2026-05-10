import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from("collection_item")
    .select("section")
    .eq("collection_id", id)
    .not("section", "is", null);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.section) set.add(row.section);
  }
  const sections = [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return NextResponse.json({ sections });
}
