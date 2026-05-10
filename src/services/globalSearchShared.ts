// Shared types e helpers de busca, sem dependência de server-only.
// O service `globalSearch.ts` (que usa next/headers via createClient) re-exporta
// os tipos daqui, mas componentes client devem importar deste arquivo direto.

export type SearchCategory =
  | "book"
  | "serie"
  | "author"
  | "quote"
  | "wishlist"
  | "collection";

export type SearchResultItem = {
  id: string;
  slug?: string | null;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  cover_url?: string | null;
};

export type SearchResultGroup = {
  category: SearchCategory;
  label: string;
  items: SearchResultItem[];
  total: number;
};

export type GlobalSearchResult = {
  groups: SearchResultGroup[];
  total: number;
};

/** Helper pra montar href do item — consumido pelo dropdown e pela /search. */
export function hrefForResult(
  category: SearchCategory,
  slug: string | null | undefined,
  id: string,
): string {
  switch (category) {
    case "book":
      return slug ? `/book/${slug}` : `/book`;
    case "serie":
      return slug ? `/serie/${slug}` : `/serie`;
    case "author":
      return slug ? `/author/${slug}` : `/book`;
    case "quote":
      return slug ? `/quote/${slug}` : `/quote`;
    case "wishlist":
      return slug ? `/wishlist/${slug}` : `/wishlist`;
    case "collection":
      return slug ? `/collection/${slug}` : `/collection`;
    default:
      void id;
      return "/";
  }
}
