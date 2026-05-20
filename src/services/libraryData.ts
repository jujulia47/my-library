import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import type { Database } from "@/utils/typings/supabase";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];

// /library mostra livros que estão fisicamente conosco. Sessão 17.2 trocou o
// filtro `physical_status IN (em_casa, emprestado)` por `ownership_status IN
// (owned, lent_out)` (mesmo significado, enum unificado).
const PHYSICALLY_HERE: OwnershipStatus[] = ["owned", "lent_out"];

// =============================================================================
// Tipos públicos
// =============================================================================

export type ShelfSymbol =
  | "moon"
  | "sun"
  | "feather"
  | "key"
  | "rose"
  | "crown"
  | "star"
  | "flame";

export const ALL_SHELF_SYMBOLS: ShelfSymbol[] = [
  "moon",
  "sun",
  "feather",
  "key",
  "rose",
  "crown",
  "star",
  "flame",
];

export type ShelfBook = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  pages: number | null;
  volume: number | null;
  serie_id: string | null;
  serie_name: string | null;
  ownership_status: OwnershipStatus;
  shelf_id: string;
  shelf_position: number;
  spine_color: string;
  spine_width: number;
  is_laying_down: boolean;
};

export type Shelf = {
  id: string;
  ordering: number;
  symbol: ShelfSymbol;
  books: ShelfBook[];
  total_books: number;
};

export type LibraryData = {
  shelves: Shelf[];
  total_books: number;
  /** Livros físicos em casa/emprestados que estão sem `shelf_id` — listados
   *  numa seção "Sem estante" no fim do mural pra que possam ser arrastados
   *  pras estantes reais. */
  unshelved: ShelfBook[];
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Paleta de 12 tons de capa de livro vintage. Reaproveita cores quentes do
 * design system (burgundy, cappuccino, gold-deep, navy escurecido) + tons
 * extras pra dar variedade.
 */
const SPINE_PALETTE = [
  "#6B2A2A", // burgundy escuro
  "#5C3F1A", // sépia
  "#1A4D2E", // verde escuro
  "#4A2A6E", // roxo escuro
  "#6E4A2A", // cappuccino escuro
  "#5C2A4A", // vinho
  "#2A3E5C", // navy escuro
  "#854F0B", // gold-deep
  "#3E2810", // marrom muito escuro
  "#2E4A2E", // verde-musgo
  "#5C2A1A", // terracota escuro
  "#2A4A5C", // azul-petróleo
];

/**
 * Hash determinístico do bookId → cor da paleta. Estável entre renders.
 *
 * Decisão de produto: cor real extraída da capa via canvas/sharp seria mais
 * fiel mas exige download da imagem ou processamento server-side custoso.
 * V1 usa paleta determinística — visualmente coerente e zero overhead.
 * Anotado como dívida técnica pra revisitar se o user reclamar.
 */
export function computeSpineColor(bookId: string): string {
  let hash = 0;
  for (let i = 0; i < bookId.length; i += 1) {
    hash = (hash << 5) - hash + bookId.charCodeAt(i);
    hash = hash & hash; // force int32
  }
  return SPINE_PALETTE[Math.abs(hash) % SPINE_PALETTE.length];
}

/**
 * Largura da lombada em px, derivada de `pages`. Linear: 100 páginas → 18px,
 * 500 → 32px, 1000+ → 50px (clamp). Sem páginas → 28px (default razoável).
 */
export function computeSpineWidth(pages: number | null): number {
  if (!pages) return 28;
  const width = 14 + pages / 30;
  return Math.max(18, Math.min(50, Math.round(width)));
}

/**
 * Determinístico: ~12.5% dos livros aparecem deitados na estante. Adiciona
 * variedade visual sem precisar de campo no banco. Mesmo bookId → sempre
 * mesma decisão.
 */
export function computeIsLayingDown(bookId: string): boolean {
  let hash = 0;
  for (let i = 0; i < bookId.length; i += 1) {
    hash = (hash << 5) - hash + bookId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 8 === 0;
}

// =============================================================================
// Initial seed (lazy)
// =============================================================================

const INITIAL_SHELVES: { ordering: number; symbol: ShelfSymbol }[] = [
  { ordering: 0, symbol: "moon" },
  { ordering: 1, symbol: "sun" },
  { ordering: 2, symbol: "feather" },
];

/**
 * Cria 3 estantes iniciais pra um user que ainda não tem nenhuma. Usado como
 * fallback se o backfill da migration não pegou (user criado depois da
 * migration ou que não tinha nenhum livro físico no momento da migration).
 */
async function ensureInitialShelves(
  supabase: SupabaseServer,
  userId: string,
): Promise<void> {
  await supabase.from("shelf").insert(
    INITIAL_SHELVES.map((s) => ({
      user_id: userId,
      ordering: s.ordering,
      symbol: s.symbol,
    })),
  );
}

// =============================================================================
// Queries
// =============================================================================

type ShelfRowMin = { id: string; ordering: number; symbol: string };

type BookForShelfRaw = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  pages: number | null;
  volume: number | null;
  shelf_id: string | null;
  shelf_position: number | null;
  ownership_status: OwnershipStatus;
  serie: { id: string; name: string } | null;
  book_author: { author: { name: string } | null }[] | null;
};

function mapBookToShelfBook(
  b: BookForShelfRaw,
  fallbackShelfId: string,
): ShelfBook {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author_name:
      b.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null,
    cover_url: b.cover ? imagesUrl(b.cover) : null,
    pages: b.pages,
    volume: b.volume,
    serie_id: b.serie?.id ?? null,
    serie_name: b.serie?.name ?? null,
    ownership_status: b.ownership_status,
    shelf_id: b.shelf_id ?? fallbackShelfId,
    shelf_position: b.shelf_position ?? 0,
    spine_color: computeSpineColor(b.id),
    spine_width: computeSpineWidth(b.pages),
    is_laying_down: computeIsLayingDown(b.id),
  };
}

const BOOK_SELECT = `
  id, slug, title, cover, pages, volume,
  shelf_id, shelf_position, ownership_status,
  serie:serie_id(id, name),
  book_author(author(name))
`;

export async function getLibraryData(userId: string): Promise<LibraryData> {
  const startedAt = Date.now();
  const supabase = await createClient();

  // 1. Estantes do user
  let { data: shelves } = await supabase
    .from("shelf")
    .select("id, ordering, symbol")
    .eq("user_id", userId)
    .order("ordering", { ascending: true });

  // 2. Lazy-create se vazio (defesa em profundidade do backfill).
  if (!shelves || shelves.length === 0) {
    await ensureInitialShelves(supabase, userId);
    const { data: created } = await supabase
      .from("shelf")
      .select("id, ordering, symbol")
      .eq("user_id", userId)
      .order("ordering", { ascending: true });
    shelves = created ?? [];
  }

  // 3. Books físicos com `ownership_status` em (owned, lent_out) — sessão 17.2.
  const { data: books } = await supabase
    .from("book")
    .select(BOOK_SELECT)
    .eq("user_id", userId)
    .in("ownership_status", PHYSICALLY_HERE)
    .contains("formats_owned", ["physical"])
    .order("shelf_position", { ascending: true, nullsFirst: false });

  // 4. Group books por shelf_id. Livros sem shelf_id (ou com shelf_id que
  //    não bate com nenhuma estante real — defensivo) vão pra `unshelved`,
  //    que é exibida como seção separada no mural.
  const byShelf = new Map<string, ShelfBook[]>();
  for (const s of shelves ?? []) byShelf.set(s.id, []);
  const unshelved: ShelfBook[] = [];

  for (const b of (books as unknown as BookForShelfRaw[] | null) ?? []) {
    if (!b.shelf_id || !byShelf.has(b.shelf_id)) {
      // Não tem estante (ou aponta pra estante deletada). Vira órfão.
      unshelved.push(mapBookToShelfBook(b, ""));
      continue;
    }
    byShelf.get(b.shelf_id)!.push(mapBookToShelfBook(b, b.shelf_id));
  }

  const result: Shelf[] = (shelves ?? []).map((s: ShelfRowMin) => ({
    id: s.id,
    ordering: s.ordering,
    symbol: s.symbol as ShelfSymbol,
    books: byShelf.get(s.id) ?? [],
    total_books: (byShelf.get(s.id) ?? []).length,
  }));

  console.log(`[libraryData] took ${Date.now() - startedAt}ms`);

  return {
    shelves: result,
    total_books:
      result.reduce((acc, s) => acc + s.total_books, 0) + unshelved.length,
    unshelved,
  };
}

/**
 * Carrega uma única estante por id. Ownership checado via RLS (filtra por
 * user_id). Books ordenados por shelf_position (ascendente).
 */
export async function getShelfById(
  shelfId: string,
  userId: string,
): Promise<Shelf | null> {
  const supabase = await createClient();

  const { data: shelf } = await supabase
    .from("shelf")
    .select("id, ordering, symbol")
    .eq("id", shelfId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!shelf) return null;

  const { data: books } = await supabase
    .from("book")
    .select(BOOK_SELECT)
    .eq("user_id", userId)
    .eq("shelf_id", shelfId)
    .in("ownership_status", PHYSICALLY_HERE)
    .contains("formats_owned", ["physical"])
    .order("shelf_position", { ascending: true, nullsFirst: false });

  const mapped = (
    (books as unknown as BookForShelfRaw[] | null) ?? []
  ).map((b) => mapBookToShelfBook(b, shelf.id));

  return {
    id: shelf.id,
    ordering: shelf.ordering,
    symbol: shelf.symbol as ShelfSymbol,
    books: mapped,
    total_books: mapped.length,
  };
}
