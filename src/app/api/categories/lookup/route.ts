import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") ?? "").trim();
  if (!name) {
    return NextResponse.json({ category: null });
  }

  const { data } = await supabase
    .from("category")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("name", name)
    .maybeSingle();

  return NextResponse.json({ category: data ?? null });
}
