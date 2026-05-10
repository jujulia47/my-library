import { createClient } from "@/utils/supabase/server";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";
import type { Database } from "@/utils/typings/supabase";

type WishlistRow = Database["public"]["Tables"]["wishlist"]["Row"];
type WishlistPriority = Database["public"]["Enums"]["wishlist_priority"];

export type WishlistPriorityFilter = WishlistPriority | "none";
export type WishlistPriceRange =
  | "under_30"
  | "30_60"
  | "60_100"
  | "over_100"
  | "none";

export type WishlistListSort =
  | "newest"
  | "priority"
  | "price_asc"
  | "price_desc"
  | "title_asc";

export type WishlistListParams = {
  search?: string;
  priorities?: WishlistPriorityFilter[];
  priceRanges?: WishlistPriceRange[];
  sort?: WishlistListSort;
};

const PRIORITY_RANK: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function inRange(price: number | null, range: WishlistPriceRange): boolean {
  if (range === "none") return price === null;
  if (price === null) return false;
  if (range === "under_30") return price < 30;
  if (range === "30_60") return price >= 30 && price < 60;
  if (range === "60_100") return price >= 60 && price < 100;
  if (range === "over_100") return price >= 100;
  return false;
}

/**
 * Lista wishlist com filtros multi-valor combinados (AND entre grupos, OR
 * dentro). `search` faz ilike combinado em title/author_name.
 *
 * priceRanges resolvido em memória — fácil de combinar 4 ranges + "none" sem
 * montar `or(...)` no PostgREST. Volume da wishlist tende a ser baixo
 * (dezenas/centenas), então custo é desprezível.
 */
export async function wishlistListQuery(
  params: WishlistListParams = {},
): Promise<WishlistRow[]> {
  const supabase = await createClient();
  const sort = params.sort ?? "newest";

  let query = supabase.from("wishlist").select("*");

  // Search accent + case insensitive via *_normalized (sessão 12).
  if (params.search?.trim()) {
    const term = normalizeSearchQuery(params.search).replace(/[%_]/g, " ");
    query = query.or(
      `title_normalized.ilike.%${term}%,author_name_normalized.ilike.%${term}%`,
    );
  }

  // Priority: linked filter (low|medium|high)
  const priorities = (params.priorities ?? []).filter(
    (p): p is WishlistPriorityFilter =>
      p === "low" || p === "medium" || p === "high" || p === "none",
  );
  if (priorities.length > 0) {
    const wantsNone = priorities.includes("none");
    const concrete = priorities.filter(
      (p): p is WishlistPriority => p !== "none",
    );
    if (wantsNone && concrete.length === 0) {
      query = query.is("priority", null);
    } else if (!wantsNone && concrete.length > 0) {
      query = concrete.length === 1
        ? query.eq("priority", concrete[0])
        : query.in("priority", concrete);
    } else if (wantsNone && concrete.length > 0) {
      // OR: priority IS NULL OR priority IN (...)
      const inList = concrete.join(",");
      query = query.or(`priority.is.null,priority.in.(${inList})`);
    }
  }

  // Sort nativo onde dá.
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "title_asc") {
    query = query.order("title", { ascending: true });
  } else if (sort === "price_asc") {
    query = query.order("estimated_price", {
      ascending: true,
      nullsFirst: false,
    });
  } else if (sort === "price_desc") {
    query = query.order("estimated_price", {
      ascending: false,
      nullsFirst: false,
    });
  }

  const { data, error } = await query;
  if (error) return [];

  let items: WishlistRow[] = data ?? [];

  // priceRanges: filtro em memória. Tipos válidos pra evitar lixo de URL.
  const ranges = (params.priceRanges ?? []).filter((r): r is WishlistPriceRange =>
    ["under_30", "30_60", "60_100", "over_100", "none"].includes(r),
  );
  if (ranges.length > 0) {
    items = items.filter((w) =>
      ranges.some((r) => inRange(w.estimated_price ?? null, r)),
    );
  }

  // Sort de prioridade: high > medium > low > null. Em memória pra
  // controlar a ordenação de null no fim.
  if (sort === "priority") {
    items = items.slice().sort((a, b) => {
      const ar = a.priority ? PRIORITY_RANK[a.priority] : 99;
      const br = b.priority ? PRIORITY_RANK[b.priority] : 99;
      if (ar !== br) return ar - br;
      // tiebreak: criação mais recente
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
  }

  return items;
}

export async function wishlistTotals(): Promise<{
  count: number;
  estimatedTotal: number;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist")
    .select("estimated_price");
  const rows = data ?? [];
  const estimatedTotal = rows.reduce((sum, r) => {
    const v = r.estimated_price ?? 0;
    return sum + (Number.isFinite(v) ? Number(v) : 0);
  }, 0);
  return { count: rows.length, estimatedTotal };
}

export async function wishlistById(id: string): Promise<WishlistRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function wishlistBySlug(slug: string): Promise<WishlistRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data;
}
