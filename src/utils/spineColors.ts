/**
 * Cor da lombada na vista parede da `/library` (sessão 17.4).
 * Hash determinístico do `book.id` em rotação de 8 cores. Mesmo livro =
 * sempre mesma cor entre renders.
 *
 * Diferente de `colorByHash` (genrePie/year): aqui inclui `cappuccino` e
 * `ink-deep` (cores escuras) — coerente com lombadas vintage.
 */
export const SPINE_COLOR_TOKENS = [
  "burgundy",
  "moss",
  "navy",
  "terracota",
  "olive",
  "cappuccino",
  "gold-deep",
  "ink-deep",
] as const;

export type SpineColorToken = (typeof SPINE_COLOR_TOKENS)[number];

const SPINE_HEX: Record<SpineColorToken, string> = {
  burgundy: "#82393A",
  moss: "#5C6E47",
  navy: "#1E3A5F",
  terracota: "#BC6E48",
  olive: "#85614B",
  cappuccino: "#6B5240",
  "gold-deep": "#A0843E",
  "ink-deep": "#4A3826",
};

/** Cores escuras precisam de texto claro pra ler (vs gold-deep que usa
 *  texto dourado escuro). Sessão 17.5: confirmado que `cappuccino` (#6B5240,
 *  marrom médio-escuro) precisa de texto claro — antes era classificado
 *  como "claro" e o gold-deep ficava ilegível. `olive` (#85614B) também
 *  está no limite mas mantém gold-deep — luminância ~50, ainda legível. */
const DARK_SPINES: SpineColorToken[] = [
  "burgundy",
  "navy",
  "cappuccino",
  "ink-deep",
];

function hashIdToIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % SPINE_COLOR_TOKENS.length;
}

export function spineTokenForBookId(id: string): SpineColorToken {
  return SPINE_COLOR_TOKENS[hashIdToIndex(id)];
}

export function spineHexForBookId(id: string): string {
  return SPINE_HEX[spineTokenForBookId(id)];
}

/** Escurece um hex em N% pelo método aproximado (subtrai do RGB). */
function darken(hex: string, percent: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const factor = 1 - percent / 100;
  const r2 = Math.max(0, Math.round(r * factor));
  const g2 = Math.max(0, Math.round(g * factor));
  const b2 = Math.max(0, Math.round(b * factor));
  return `#${r2.toString(16).padStart(2, "0")}${g2.toString(16).padStart(2, "0")}${b2.toString(16).padStart(2, "0")}`;
}

export function spineGradientForBookId(id: string): string {
  const hex = spineHexForBookId(id);
  return `linear-gradient(180deg, ${hex} 0%, ${darken(hex, 15)} 100%)`;
}

export function spineTextClassForBookId(id: string): string {
  const token = spineTokenForBookId(id);
  // Sessão 17.5: trocado de `text-paper-aged` (#F5E8D0) pra `text-ivory-light`
  // (#FAF6EC) — mais branco, contraste melhor em lombadas escuras como
  // cappuccino. text-gold-deep nas claras (gold-deep como cor não-fundo).
  return DARK_SPINES.includes(token) ? "text-ivory-light" : "text-gold-deep";
}

/**
 * Width da lombada em px. Proporcional a `pages` com clamp 24-44.
 * Livros sem pages → 32px (médio).
 */
export function spineWidthForPages(pages: number | null | undefined): number {
  if (!pages || pages <= 0) return 32;
  const computed = Math.round(pages / 15);
  return Math.max(24, Math.min(44, computed));
}

/**
 * Espessura do livro quando deitado horizontalmente em px (sessão 17.10).
 * Idêntica ao `spineWidthForPages` (24-44) — quando o usuário deita o livro,
 * a "altura" agora é literalmente a mesma que sua espessura quando em pé,
 * pra coerência física. Edge case: 5 livros num cluster com pages altas
 * podem somar > 200px e estourar levemente o topo da prateleira; aceito
 * como tradeoff em troca da consistência visual pedida.
 */
export function layingThicknessForPages(
  pages: number | null | undefined,
): number {
  return spineWidthForPages(pages);
}
