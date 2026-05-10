/**
 * Normaliza um nome (autor, série, categoria) para detecção de similaridade.
 * Lowercase + remove acentos + colapsa espaços + trim.
 *
 * Mesmo critério usado por `formateTitleToSlug` para os acentos: NFD +
 * remoção do range U+0300–U+036F (combining diacritical marks).
 */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
