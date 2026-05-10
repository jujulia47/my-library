/**
 * Normaliza query de busca pra match com colunas *_normalized do banco
 * (geradas via `lower(immutable_unaccent(coluna))` na migration de unaccent).
 *
 * Aplica:
 * - lowercase
 * - NFD + filtra diacríticos (á → a, ç → c, ñ → n etc.)
 * - trim
 *
 * Uso:
 *   const q = normalizeSearchQuery(userInput);
 *   query.ilike("title_normalized", `%${q}%`);
 *
 * Não usar pra outros fins (slugify, comparação de nomes em
 * AuthorMultiSelect — ver `normalizeName.ts` que preserva espaços).
 */
export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}
