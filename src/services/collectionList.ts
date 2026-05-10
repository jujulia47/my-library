import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

type CollectionRow = Database["public"]["Tables"]["collection"]["Row"];
type CollectionType = Database["public"]["Enums"]["collection_type"];

export type CollectionListSort =
  | "newest"
  | "type_asc"
  | "progress_asc"
  | "progress_desc"
  | "name_asc";

export type CollectionStatusFilter = "active" | "completed" | "archived";

export type CollectionListParams = {
  types?: string[];
  statuses?: string[];
  providers?: string[];
  sort?: CollectionListSort;
};

export type CollectionSection = {
  name: string;
  count: number;
};

export type CollectionListItem = CollectionRow & {
  book_count: number;
  read_count: number;
  wishlist_count: number;
  estimated_value: number | null;
  progress_percent: number;
  sections: CollectionSection[];
  is_completed: boolean;
};

const VALID_TYPES: CollectionType[] = [
  "shelf",
  "list",
  "challenge",
  "subscription",
  "wishlist",
];

const VALID_STATUSES: CollectionStatusFilter[] = [
  "active",
  "completed",
  "archived",
];

type RawCollectionItemFromQuery = {
  id: string;
  book_id: string | null;
  wishlist_id: string | null;
  section: string | null;
  was_wishlist: boolean;
  book: { reading: { status: string }[] | null } | null;
  wishlist: { estimated_price: number | string | null } | null;
};

type RawCollectionFromQuery = CollectionRow & {
  collection_item?: RawCollectionItemFromQuery[] | null;
};

function flatten(raw: RawCollectionFromQuery): CollectionListItem {
  const items = raw.collection_item ?? [];

  let book_count = 0;
  let read_count = 0;
  let wishlist_count = 0;
  let estimated_value: number | null = null;
  const sectionMap = new Map<string, number>();

  for (const item of items) {
    if (item.section) {
      sectionMap.set(item.section, (sectionMap.get(item.section) ?? 0) + 1);
    }

    if (item.book_id) {
      book_count += 1;
      const readings = item.book?.reading ?? [];
      if (readings.some((r) => r.status === "finished")) {
        read_count += 1;
      }
    } else if (item.wishlist_id) {
      wishlist_count += 1;
      const price = item.wishlist?.estimated_price;
      if (price !== null && price !== undefined) {
        const num = typeof price === "string" ? Number(price) : price;
        if (Number.isFinite(num)) {
          estimated_value = (estimated_value ?? 0) + num;
        }
      }
    }
  }

  const total_count = book_count + wishlist_count;

  let progress_percent: number;
  let is_completed: boolean;
  if (raw.type === "wishlist") {
    // Em coleção wishlist, progresso = adquiridos (book_count) / total. Os
    // items que ainda são wishlist são "pendentes"; quando viram book pelo
    // fluxo "marcar como adquirido" (was_wishlist=true), contam como
    // adquiridos. Assume todos os book_id em wishlist coleção têm
    // was_wishlist=true (validação no addCollectionItem garante isso).
    progress_percent =
      total_count > 0 ? Math.min(100, (book_count / total_count) * 100) : 0;
    is_completed = total_count > 0 && book_count === total_count;
  } else if (raw.type === "challenge") {
    const goal = raw.goal_count ?? 0;
    progress_percent = goal > 0 ? Math.min(100, (read_count / goal) * 100) : 0;
    is_completed = goal > 0 && read_count >= goal;
  } else {
    progress_percent =
      total_count > 0 ? (read_count / total_count) * 100 : 0;
    is_completed = total_count > 0 && read_count === total_count;
  }

  const sections = [...sectionMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const baseRow: CollectionRow = {
    created_at: raw.created_at,
    completed_at: raw.completed_at ?? null,
    description: raw.description,
    description_normalized: raw.description_normalized ?? null,
    end_date: raw.end_date,
    goal_count: raw.goal_count,
    id: raw.id,
    is_archived: raw.is_archived,
    is_favorite: raw.is_favorite,
    name: raw.name,
    name_normalized: raw.name_normalized ?? null,
    provider: raw.provider,
    provider_normalized: raw.provider_normalized ?? null,
    slug: raw.slug,
    start_date: raw.start_date,
    type: raw.type,
    updated_at: raw.updated_at,
    user_id: raw.user_id,
  };

  return {
    ...baseRow,
    book_count,
    read_count,
    wishlist_count,
    estimated_value,
    progress_percent,
    sections,
    is_completed,
  };
}

/**
 * Lista coleções com filtros multi-valor combinados (AND entre grupos, OR
 * dentro do grupo).
 *
 * - `types`: collection.type IN [...] (filtro nativo)
 * - `providers`: collection.provider IN [...] (filtro nativo)
 * - `statuses`: derivado em memória — active = !archived && !completed,
 *   completed = !archived && completed, archived = is_archived. Quando
 *   nenhum status é selecionado, esconde arquivadas (default).
 *
 * Sort: `newest` (updated_at desc), `type_asc`, `name_asc` são nativos.
 * `progress_asc/desc` é derivado (depende de read_count) — sort em memória.
 */
export async function collectionListQuery(
  params: CollectionListParams = {},
): Promise<CollectionListItem[]> {
  const supabase = await createClient();
  const sort = params.sort ?? "newest";

  let query = supabase
    .from("collection")
    .select(
      `*, collection_item(id, book_id, wishlist_id, section,
        book:book_id(reading(status)),
        wishlist:wishlist_id(estimated_price))`,
    );

  const validTypes = (params.types ?? []).filter((t): t is CollectionType =>
    VALID_TYPES.includes(t as CollectionType),
  );
  if (validTypes.length === 1) {
    query = query.eq("type", validTypes[0]);
  } else if (validTypes.length > 1) {
    query = query.in("type", validTypes);
  }

  const validProviders = (params.providers ?? []).filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );
  if (validProviders.length === 1) {
    query = query.eq("provider", validProviders[0]);
  } else if (validProviders.length > 1) {
    query = query.in("provider", validProviders);
  }

  if (sort === "newest") {
    query = query.order("updated_at", { ascending: false });
  } else if (sort === "name_asc") {
    query = query.order("name", { ascending: true });
  } else if (sort === "type_asc") {
    query = query
      .order("type", { ascending: true })
      .order("name", { ascending: true });
  }

  const { data, error } = await query;
  if (error) return [];

  let collections = (data ?? []).map((row) =>
    flatten(row as RawCollectionFromQuery),
  );

  // Status: derivado em memória.
  const requestedStatuses = (params.statuses ?? []).filter(
    (s): s is CollectionStatusFilter =>
      VALID_STATUSES.includes(s as CollectionStatusFilter),
  );

  if (requestedStatuses.length === 0) {
    // Default: esconde arquivadas.
    collections = collections.filter((c) => !c.is_archived);
  } else {
    const wantsActive = requestedStatuses.includes("active");
    const wantsCompleted = requestedStatuses.includes("completed");
    const wantsArchived = requestedStatuses.includes("archived");
    collections = collections.filter((c) => {
      if (c.is_archived) return wantsArchived;
      if (c.is_completed) return wantsCompleted;
      return wantsActive;
    });
  }

  if (sort === "progress_asc") {
    collections = collections
      .slice()
      .sort((a, b) => a.progress_percent - b.progress_percent);
  } else if (sort === "progress_desc") {
    collections = collections
      .slice()
      .sort((a, b) => b.progress_percent - a.progress_percent);
  } else if (sort === "newest") {
    // Sort default: favoritas vêm antes; entre iguais, updated_at desc.
    // Os outros sorts respeitam a coluna pedida pura — quem ordena por nome
    // ou progresso quer ver pela coluna, não favoritas em primeiro.
    collections = collections.slice().sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
    });
  }

  return collections;
}

/**
 * Counts agregados pra subtitle do PageHeader.
 *  - total: número de coleções não-arquivadas
 *  - unique_books: livros distintos agrupados em coleções não-arquivadas
 */
export async function collectionCounts() {
  const supabase = await createClient();

  const { count: totalCount } = await supabase
    .from("collection")
    .select("id", { count: "exact", head: true })
    .eq("is_archived", false);

  // collection_item.book_id distintos onde a coleção não está arquivada.
  // Faz join de volta pra collection só pra excluir arquivadas.
  const { data: items } = await supabase
    .from("collection_item")
    .select("book_id, wishlist_id, collection:collection_id(is_archived)");
  const uniqueBooks = new Set<string>();
  const uniqueWishlist = new Set<string>();
  for (const it of items ?? []) {
    const archived = (it as { collection?: { is_archived: boolean } | null })
      .collection?.is_archived;
    if (archived) continue;
    if (it.book_id) uniqueBooks.add(it.book_id);
    else if (it.wishlist_id) uniqueWishlist.add(it.wishlist_id);
  }

  return {
    total: totalCount ?? 0,
    unique_items: uniqueBooks.size + uniqueWishlist.size,
  };
}

/**
 * Lista providers únicos das coleções de assinatura. Popula select de filtros.
 */
export async function subscriptionProviders(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("collection")
    .select("provider")
    .eq("type", "subscription")
    .not("provider", "is", null);
  const providers = new Set<string>();
  for (const row of data ?? []) {
    if (row.provider) providers.add(row.provider);
  }
  return [...providers].sort();
}
