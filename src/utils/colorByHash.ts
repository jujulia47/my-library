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
// Paleta "café & floresta" — predomina browns quentes (chestnut/caramel/
// cinnamon/espresso) intercalados com green/red/blue/dark-green pra variação.
// Cada cor vizinha foi posicionada com contraste forte pra evitar pizzas
// com slices indistinguíveis. A ordem importa: o hash usa o índice direto.
export const PIE_COLORS_HEX = [
  "#6D3914", // roasted-chestnut — marrom escuro warm
  "#173125", // forest — verde profundo
  "#AB7843", // caramel-drizzle — marrom médio warm
  "#82393A", // burgundy
  "#5C6E47", // moss
  "#4C2B08", // espresso-shot — marrom quase preto
  "#1E3A5F", // navy
  "#B8957F", // cinnamon-latte — marrom claro warm
] as const;

export const PIE_COLORS_TOKEN = [
  "roasted-chestnut",
  "forest",
  "caramel-drizzle",
  "burgundy",
  "moss",
  "espresso-shot",
  "navy",
  "cinnamon-latte",
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
