import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import { collectionTypeLabels } from "@/components/ui/CollectionTypeBadge";
import { normalizeSearchQuery } from "@/utils/normalizeSearchQuery";
import type {
  SearchCategory,
  SearchResultGroup,
  SearchResultItem,
  GlobalSearchResult,
} from "@/services/globalSearchShared";

// Re-export pra back-compat com consumers existentes (Server Components).
export type {
  SearchCategory,
  SearchResultGroup,
  SearchResultItem,
  GlobalSearchResult,
};
export { hrefForResult } from "@/services/globalSearchShared";

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  book: "Livros",
  serie: "Séries",
  author: "Autores",
  quote: "Citações",
  wishlist: "Wishlist",
  collection: "Coleções",
};

/** Escapa wildcards LIKE pra evitar injeção/expansão indesejada do termo.
 *  Trabalha em cima do já-normalizado (lowercase + sem acentos) — só remove
 *  os wildcards `%` e `_` e trunca pra ≤100. */
function sanitizeQuery(raw: string): string {
  return raw.replace(/[%_]/g, " ").slice(0, 100);
}

function deriveBookStatus(
  readings: { status: string; finish_date: string | null; start_date: string | null }[] | null | undefined,
): string {
  const sorted = (readings ?? []).slice().sort((a, b) => {
    const af = a.finish_date ?? "";
    const bf = b.finish_date ?? "";
    if (af !== bf) return bf.localeCompare(af);
    return (b.start_date ?? "").localeCompare(a.start_date ?? "");
  });
  const last = sorted[0];
  if (!last) return "Quero ler";
  switch (last.status) {
    case "reading":
      return "Lendo";
    case "paused":
      return "Pausado";
    case "finished":
      return "Lido";
    case "abandoned":
      return "Abandonado";
    default:
      return "";
  }
}

/**
 * Busca global em paralelo nas 6 categorias. Cada query usa ilike (case-
 * insensitive) e filtros nativos por user_id (RLS já restringe, mas explícito
 * acelera planning). Limita resultados por categoria (default 5) e devolve
 * o total real via count: 'exact' separado.
 *
 * Ranking: ordem natural updated_at desc por enquanto. Refinar relevância
 * (match exato, prefixo) é refinamento futuro — anotado na descrição da
 * categoria onde mais ajudaria (book/serie).
 */
export async function globalSearch(
  rawQuery: string,
  limit_per_category = 5,
): Promise<GlobalSearchResult> {
  // Sanitiza e normaliza (lowercase + remove acentos) — match contra colunas
  // *_normalized geradas via `lower(immutable_unaccent(...))` na migration.
  const normalized = sanitizeQuery(normalizeSearchQuery(rawQuery));
  if (normalized.length < 2) return { groups: [], total: 0 };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { groups: [], total: 0 };

  const pat = `%${normalized}%`;
  const userId = user.id;

  // Queries paralelas por categoria. Cada uma retorna { items, total }.
  const [bookRes, serieRes, authorRes, quoteRes, wishlistRes, collectionRes] =
    await Promise.all([
      searchBooks(supabase, userId, normalized, pat, limit_per_category),
      searchSeries(supabase, userId, normalized, pat, limit_per_category),
      searchAuthors(supabase, userId, normalized, pat, limit_per_category),
      searchQuotes(supabase, userId, normalized, pat, limit_per_category),
      searchWishlist(supabase, userId, normalized, pat, limit_per_category),
      searchCollections(supabase, userId, normalized, pat, limit_per_category),
    ]);

  const groups: SearchResultGroup[] = [
    bookRes,
    serieRes,
    authorRes,
    quoteRes,
    wishlistRes,
    collectionRes,
  ].filter((g) => g.items.length > 0);
  const total = groups.reduce((s, g) => s + g.total, 0);
  return { groups, total };
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function searchBooks(
  supabase: SupabaseClient,
  userId: string,
  _query: string,
  pat: string,
  limit: number,
): Promise<SearchResultGroup> {
  const select = `id, slug, title, cover, updated_at,
    book_author(author(name)),
    reading(status, finish_date, start_date)`;

  // Match accent-insensitive via title_normalized. original_title e synopsis
  // ficaram fora desta sessão (não foram normalizados — busca menos comum).
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("book")
      .select(select)
      .eq("user_id", userId)
      .ilike("title_normalized", pat)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("book")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .ilike("title_normalized", pat),
  ]);

  if (error) return emptyGroup("book");

  const items: SearchResultItem[] = (data ?? []).map((b) => {
    const authors =
      (b as unknown as { book_author?: { author: { name: string } | null }[] | null })
        .book_author?.map((ba) => ba.author?.name)
        .filter((n): n is string => !!n) ?? [];
    const author = authors[0] ?? "Sem autor";
    const status = deriveBookStatus(
      (b as unknown as { reading?: { status: string; finish_date: string | null; start_date: string | null }[] | null }).reading,
    );
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      subtitle: status ? `${author} · ${status}` : author,
      cover_url: b.cover ? imagesUrl(b.cover) : null,
    };
  });

  return {
    category: "book",
    label: CATEGORY_LABELS.book,
    items,
    total: count ?? items.length,
  };
}

async function searchSeries(
  supabase: SupabaseClient,
  userId: string,
  _query: string,
  pat: string,
  limit: number,
): Promise<SearchResultGroup> {
  // serie.description não foi normalizada — fica de fora desta sessão.
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("serie")
      .select(
        `id, slug, name, qty_volumes,
         book(reading(status)),
         book_author:book(book_author(author(name)))`,
      )
      .eq("user_id", userId)
      .ilike("name_normalized", pat)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("serie")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .ilike("name_normalized", pat),
  ]);

  if (error) return emptyGroup("serie");

  const items: SearchResultItem[] = (data ?? []).map((s) => {
    const raw = s as unknown as {
      id: string;
      slug: string;
      name: string;
      qty_volumes: number | null;
      book?: { reading?: { status: string }[] | null }[] | null;
    };
    const totalBooks = raw.book?.length ?? 0;
    const finishedCount =
      raw.book?.filter((b) =>
        b.reading?.some((r) => r.status === "finished"),
      ).length ?? 0;
    const progress = raw.qty_volumes
      ? `${finishedCount}/${raw.qty_volumes} livros`
      : `${totalBooks} livros`;
    return {
      id: raw.id,
      slug: raw.slug,
      title: raw.name,
      subtitle: progress,
    };
  });

  return {
    category: "serie",
    label: CATEGORY_LABELS.serie,
    items,
    total: count ?? items.length,
  };
}

async function searchAuthors(
  supabase: SupabaseClient,
  userId: string,
  _query: string,
  pat: string,
  limit: number,
): Promise<SearchResultGroup> {
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("author")
      .select("id, slug, name")
      .eq("user_id", userId)
      .ilike("name_normalized", pat)
      .order("name", { ascending: true })
      .limit(limit),
    supabase
      .from("author")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .ilike("name_normalized", pat),
  ]);

  if (error || !data || data.length === 0) return emptyGroup("author");

  // Stats por autor (livros + citações) — em paralelo só pros retornados.
  const ids = data.map((a) => a.id);
  const [bookCounts, quoteCounts] = await Promise.all([
    supabase
      .from("book_author")
      .select("author_id")
      .in("author_id", ids),
    supabase
      .from("quote")
      .select("author_name")
      .in("author_name", data.map((a) => a.name)),
  ]);
  const booksByAuthor = new Map<string, number>();
  for (const r of bookCounts.data ?? []) {
    booksByAuthor.set(r.author_id, (booksByAuthor.get(r.author_id) ?? 0) + 1);
  }
  const quotesByName = new Map<string, number>();
  for (const r of quoteCounts.data ?? []) {
    if (r.author_name) {
      quotesByName.set(r.author_name, (quotesByName.get(r.author_name) ?? 0) + 1);
    }
  }

  const items: SearchResultItem[] = data.map((a) => {
    const bookN = booksByAuthor.get(a.id) ?? 0;
    const quoteN = quotesByName.get(a.name) ?? 0;
    const parts: string[] = [];
    parts.push(`${bookN} ${bookN === 1 ? "livro" : "livros"}`);
    if (quoteN > 0)
      parts.push(`${quoteN} ${quoteN === 1 ? "citação" : "citações"}`);
    return {
      id: a.id,
      slug: a.slug,
      title: a.name,
      subtitle: parts.join(" · "),
    };
  });

  return {
    category: "author",
    label: CATEGORY_LABELS.author,
    items,
    total: count ?? items.length,
  };
}

async function searchQuotes(
  supabase: SupabaseClient,
  userId: string,
  _query: string,
  pat: string,
  limit: number,
): Promise<SearchResultGroup> {
  // note e chapter ficaram de fora — uso raro, sem _normalized geradas.
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("quote")
      .select(
        `id, slug, text, author_name, chapter,
         book(title, slug, book_author(author(name)))`,
      )
      .eq("user_id", userId)
      .or(`text_normalized.ilike.${pat},author_name_normalized.ilike.${pat}`)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("quote")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .or(`text_normalized.ilike.${pat},author_name_normalized.ilike.${pat}`),
  ]);

  if (error) return emptyGroup("quote");

  const items: SearchResultItem[] = (data ?? []).map((q) => {
    const raw = q as unknown as {
      id: string;
      slug: string;
      text: string;
      author_name: string | null;
      chapter: string | null;
      book: {
        title: string;
        slug: string;
        book_author?: { author: { name: string } | null }[] | null;
      } | null;
    };
    const fallbackAuthor = raw.book?.book_author
      ?.map((ba) => ba.author?.name)
      .filter((n): n is string => !!n)
      .join(", ");
    const author = raw.author_name?.trim() || fallbackAuthor || null;
    const subtitleParts: string[] = [];
    if (author) subtitleParts.push(author);
    if (raw.book?.title) subtitleParts.push(raw.book.title);
    const truncated = raw.text.length > 80 ? raw.text.slice(0, 77) + "…" : raw.text;
    return {
      id: raw.id,
      slug: raw.slug,
      title: `“${truncated}”`,
      subtitle: subtitleParts.join(" · ") || null,
    };
  });

  return {
    category: "quote",
    label: CATEGORY_LABELS.quote,
    items,
    total: count ?? items.length,
  };
}

async function searchWishlist(
  supabase: SupabaseClient,
  userId: string,
  _query: string,
  pat: string,
  limit: number,
): Promise<SearchResultGroup> {
  // notes ficou de fora — uso raro, sem _normalized gerada.
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("wishlist")
      .select("id, slug, title, author_name, estimated_price, priority")
      .eq("user_id", userId)
      .or(`title_normalized.ilike.${pat},author_name_normalized.ilike.${pat}`)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("wishlist")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .or(`title_normalized.ilike.${pat},author_name_normalized.ilike.${pat}`),
  ]);

  if (error) return emptyGroup("wishlist");

  const items: SearchResultItem[] = (data ?? []).map((w) => {
    const parts: string[] = [];
    if (w.author_name) parts.push(w.author_name);
    if (w.estimated_price !== null && w.estimated_price !== undefined) {
      const n = typeof w.estimated_price === "string"
        ? Number(w.estimated_price)
        : w.estimated_price;
      if (Number.isFinite(n)) parts.push(`R$ ${Math.round(n)}`);
    }
    if (w.priority) {
      parts.push(
        w.priority === "high"
          ? "alta"
          : w.priority === "medium"
            ? "média"
            : "baixa",
      );
    }
    return {
      id: w.id,
      slug: w.slug,
      title: w.title,
      subtitle: parts.join(" · ") || null,
    };
  });

  return {
    category: "wishlist",
    label: CATEGORY_LABELS.wishlist,
    items,
    total: count ?? items.length,
  };
}

async function searchCollections(
  supabase: SupabaseClient,
  userId: string,
  _query: string,
  pat: string,
  limit: number,
): Promise<SearchResultGroup> {
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("collection")
      .select(
        `id, slug, name, type, description, provider,
         collection_item(id)`,
      )
      .eq("user_id", userId)
      .eq("is_archived", false)
      .or(
        `name_normalized.ilike.${pat},description_normalized.ilike.${pat},provider_normalized.ilike.${pat}`,
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("collection")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false)
      .or(
        `name_normalized.ilike.${pat},description_normalized.ilike.${pat},provider_normalized.ilike.${pat}`,
      ),
  ]);

  if (error) return emptyGroup("collection");

  const items: SearchResultItem[] = (data ?? []).map((c) => {
    const raw = c as unknown as {
      id: string;
      slug: string;
      name: string;
      type: keyof typeof collectionTypeLabels;
      collection_item?: { id: string }[] | null;
    };
    const typeLabel = collectionTypeLabels[raw.type];
    const itemsCount = raw.collection_item?.length ?? 0;
    return {
      id: raw.id,
      slug: raw.slug,
      title: raw.name,
      subtitle: `${typeLabel} · ${itemsCount} ${itemsCount === 1 ? "item" : "items"}`,
    };
  });

  return {
    category: "collection",
    label: CATEGORY_LABELS.collection,
    items,
    total: count ?? items.length,
  };
}

function emptyGroup(category: SearchCategory): SearchResultGroup {
  return {
    category,
    label: CATEGORY_LABELS[category],
    items: [],
    total: 0,
  };
}
