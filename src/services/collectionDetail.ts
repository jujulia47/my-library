import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

type CollectionRow = Database["public"]["Tables"]["collection"]["Row"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type WishlistPriority = Database["public"]["Enums"]["wishlist_priority"];

export type CollectionItemBook = {
  kind: "book";
  item_id: string;
  section: string | null;
  position: number | null;
  added_at: string;
  was_wishlist: boolean;
  book: {
    id: string;
    slug: string;
    title: string;
    cover: string | null;
    authors: string[];
    derived_status: ReadingStatus | "tbr" | "wont_read";
    last_activity_at: string | null;
  };
};

export type CollectionItemWishlist = {
  kind: "wishlist";
  item_id: string;
  section: string | null;
  position: number | null;
  added_at: string;
  was_wishlist: boolean; // sempre false aqui (ainda é wishlist)
  wishlist: {
    id: string;
    slug: string;
    title: string;
    author_name: string | null;
    estimated_price: number | null;
    priority: WishlistPriority | null;
  };
};

export type CollectionItem = CollectionItemBook | CollectionItemWishlist;

export type CollectionDetailData = {
  collection: CollectionRow;
  items: CollectionItem[];
  /**
   * Última atividade na coleção: max(added_at, latest reading update). Usado
   * pelo card "Última atividade" do tipo shelf.
   */
  last_activity_at: string | null;
};

type RawReadingFromQuery = {
  status: string;
  start_date: string | null;
  finish_date: string | null;
  updated_at?: string | null;
};

type RawBookFromQuery = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  wont_read: boolean | null;
  book_author: { author: { name: string } | null }[] | null;
  reading: RawReadingFromQuery[] | null;
};

type RawWishlistFromQuery = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  estimated_price: number | string | null;
  priority: WishlistPriority | null;
};

type RawCollectionItemFromQuery = {
  id: string;
  section: string | null;
  position: number | null;
  added_at: string;
  was_wishlist: boolean;
  book_id: string | null;
  wishlist_id: string | null;
  book: RawBookFromQuery | null;
  wishlist: RawWishlistFromQuery | null;
};

function deriveBookStatus(
  readings: RawReadingFromQuery[] | null,
  wontRead: boolean,
): {
  status: ReadingStatus | "tbr" | "wont_read";
  last_activity_at: string | null;
} {
  if (!readings || readings.length === 0)
    return {
      status: wontRead ? "wont_read" : "tbr",
      last_activity_at: null,
    };
  const sorted = [...readings].sort((a, b) => {
    const af = a.finish_date ?? "";
    const bf = b.finish_date ?? "";
    if (af !== bf) return bf.localeCompare(af);
    const as = a.start_date ?? "";
    const bs = b.start_date ?? "";
    return bs.localeCompare(as);
  });
  const last = sorted[0];
  return {
    status: last.status as ReadingStatus,
    last_activity_at: last.updated_at ?? last.finish_date ?? last.start_date,
  };
}

export async function getCollectionDetailBySlug(
  slug: string,
): Promise<CollectionDetailData | null> {
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collection")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!collection) return null;

  const { data: rawItems } = await supabase
    .from("collection_item")
    .select(
      `id, section, position, added_at, was_wishlist, book_id, wishlist_id,
       book:book_id(
         id, slug, title, cover, wont_read,
         book_author(author(name)),
         reading(status, start_date, finish_date, updated_at)
       ),
       wishlist:wishlist_id(
         id, slug, title, author_name, estimated_price, priority
       )`,
    )
    .eq("collection_id", collection.id);

  const items: CollectionItem[] = [];
  let lastActivity: string | null = collection.updated_at ?? null;

  for (const raw of (rawItems ?? []) as RawCollectionItemFromQuery[]) {
    if (raw.added_at && (!lastActivity || raw.added_at > lastActivity)) {
      lastActivity = raw.added_at;
    }

    if (raw.book_id && raw.book) {
      const authors =
        raw.book.book_author
          ?.map((ba) => ba.author?.name)
          .filter((n): n is string => !!n) ?? [];
      const derived = deriveBookStatus(
        raw.book.reading,
        raw.book.wont_read ?? false,
      );
      if (
        derived.last_activity_at &&
        (!lastActivity || derived.last_activity_at > lastActivity)
      ) {
        lastActivity = derived.last_activity_at;
      }
      items.push({
        kind: "book",
        item_id: raw.id,
        section: raw.section,
        position: raw.position,
        added_at: raw.added_at,
        was_wishlist: raw.was_wishlist,
        book: {
          id: raw.book.id,
          slug: raw.book.slug,
          title: raw.book.title,
          cover: raw.book.cover,
          authors,
          derived_status: derived.status,
          last_activity_at: derived.last_activity_at,
        },
      });
    } else if (raw.wishlist_id && raw.wishlist) {
      const price =
        raw.wishlist.estimated_price === null ||
        raw.wishlist.estimated_price === undefined
          ? null
          : typeof raw.wishlist.estimated_price === "string"
            ? Number(raw.wishlist.estimated_price)
            : raw.wishlist.estimated_price;
      items.push({
        kind: "wishlist",
        item_id: raw.id,
        section: raw.section,
        position: raw.position,
        added_at: raw.added_at,
        was_wishlist: raw.was_wishlist,
        wishlist: {
          id: raw.wishlist.id,
          slug: raw.wishlist.slug,
          title: raw.wishlist.title,
          author_name: raw.wishlist.author_name,
          estimated_price:
            price !== null && Number.isFinite(price) ? price : null,
          priority: raw.wishlist.priority,
        },
      });
    }
  }

  // Ordem default dentro da seção: position asc nulls last, depois added_at desc.
  items.sort((a, b) => {
    if (a.position !== null && b.position !== null && a.position !== b.position)
      return a.position - b.position;
    if (a.position !== null && b.position === null) return -1;
    if (b.position !== null && a.position === null) return 1;
    return b.added_at.localeCompare(a.added_at);
  });

  return { collection, items, last_activity_at: lastActivity };
}

/**
 * Conta em quantas coleções o item de wishlist está. Usado no hero da
 * WishlistDetailClient pra dar visibilidade.
 */
export async function wishlistCollections(
  wishlistId: string,
): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("collection_item")
    .select("collection:collection_id(id, name, slug)")
    .eq("wishlist_id", wishlistId);
  return (
    ((data ?? [])
      .map((r) => (r as unknown as { collection: { id: string; name: string; slug: string } | null }).collection)
      .filter((c): c is { id: string; name: string; slug: string } => !!c)) ?? []
  );
}
