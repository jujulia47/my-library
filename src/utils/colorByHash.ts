/**
 * Cores cíclicas pra categorias / coisas que precisam de paleta estável por
 * nome (sessão 17.3). 8 cores semânticas; mesmo nome → mesma cor entre
 * renders e entre dispositivos.
 *
 * Usado:
 *  - GenrePie (pizza de gênero na home)
 *  - YearTimeline (linhas dos livros, mesma rotação)
 *  - Lombadas em /library (futuro 17.4 — mesma rotação pra coerência)
 *
 * Hash simples (soma de char codes mod length): suficiente pra <100 entradas
 * únicas; colisões aceitáveis no rotation cíclico de 8.
 */
// Paleta reordenada (post-feedback): tons de marrom (olive, cappuccino-soft,
// ink-soft) puxavam o pie pra monocromia. Trocados pelas variantes "-soft"
// que já existem no design system → mantém família semântica, ganha contraste.
export const PIE_COLORS_HEX = [
  "#82393A", // burgundy
  "#5C6E47", // moss
  "#1E3A5F", // navy
  "#BC6E48", // terracota
  "#A0843E", // gold-deep
  "#A24749", // burgundy-soft
  "#6F8456", // moss-soft
  "#2C5078", // navy-soft
] as const;

export const PIE_COLORS_TOKEN = [
  "burgundy",
  "moss",
  "navy",
  "terracota",
  "gold-deep",
  "burgundy-soft",
  "moss-soft",
  "navy-soft",
] as const;

function hashIndex(name: string, mod = PIE_COLORS_HEX.length): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % mod;
  }
  return hash;
}

/** Hex pra usar em SVG fill / inline style. */
export function colorHexForName(name: string): string {
  return PIE_COLORS_HEX[hashIndex(name)];
}

/** Token de paleta (string nome) pra construir className. */
export function colorTokenForName(name: string): string {
  return PIE_COLORS_TOKEN[hashIndex(name)];
}
