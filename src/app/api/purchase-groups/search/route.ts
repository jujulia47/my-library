import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";

export type PurchaseGroupSearchOption = {
  id: string;
  name: string;
  total_price: number;
  acquired_at: string | null;
  book_count: number;
};

/**
 * Busca grupos de compra (boxes/kits) do usuário, retornando metadados
 * mínimos pra um picker. Inclui contagem atual de livros no grupo
 * pra o usuário visualizar "Box X (5 livros, R$300)".
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

  let query = supabase
    .from("purchase_group")
    .select("id, name, total_price, acquired_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (q) {
    const nq = normalizeSearchQuery(q).replace(/[%_]/g, " ");
    query = query.ilike("name", `%${nq}%`);
  }

  const { data: groups, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (groups ?? []).map((g) => g.id);
  let counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: books } = await supabase
      .from("book")
      .select("purchase_group_id")
      .in("purchase_group_id", ids);
    counts = (books ?? []).reduce<Record<string, number>>((acc, b) => {
      if (b.purchase_group_id) {
        acc[b.purchase_group_id] = (acc[b.purchase_group_id] ?? 0) + 1;
      }
      return acc;
    }, {});
  }

  const result: PurchaseGroupSearchOption[] = (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    total_price: Number(g.total_price),
    acquired_at: g.acquired_at ?? null,
    book_count: counts[g.id] ?? 0,
  }));
  return NextResponse.json({ groups: result });
}
