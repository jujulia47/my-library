// Formatadores de moeda em pt-BR (Real). Centralizado pra evitar uns 10
// `formatBRL` espalhados pelos componentes (cada um com casas decimais
// diferentes).

/**
 * "R$ 48,00" — sempre com 2 casas decimais e vírgula. Use em qualquer lugar
 * que mostre preço pro usuário (lista, modal, soma, card).
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Recebe o "valor em centavos" como string de dígitos (ex.: "4850") e
 * devolve o display formatado ("48,50"). Usado no input de preço pra dar
 * efeito de máscara: o user digita só dígitos, vírgula aparece sozinha.
 *
 * Casos:
 *  - ""        → ""
 *  - "5"       → "0,05"
 *  - "48"      → "0,48"
 *  - "485"     → "4,85"
 *  - "4850"    → "48,50"
 *  - "10000"   → "100,00"
 *  - "100000"  → "1.000,00"
 */
export function formatPriceInputFromDigits(digits: string): string {
  const cleaned = digits.replace(/\D/g, "");
  if (cleaned === "") return "";
  // Padding à esquerda pra garantir pelo menos 3 dígitos (R$ 0,01).
  const padded = cleaned.padStart(3, "0");
  const cents = padded.slice(-2);
  const reais = padded.slice(0, -2).replace(/^0+(?=\d)/, "");
  const reaisDisplay = Number(reais).toLocaleString("pt-BR");
  return `${reaisDisplay},${cents}`;
}

/**
 * Inverso do formatPriceInputFromDigits — pra fora do input/form, converte
 * "48,50" pra "4850" (string de centavos como digits). Útil pra recuperar
 * o estado bruto depois de mostrar formatado.
 */
export function digitsFromPriceInput(masked: string): string {
  return masked.replace(/\D/g, "");
}

/**
 * Converte um número (reais) pra digits — "48.5" pra "4850". Usado pra
 * pré-popular o input com um valor já cadastrado.
 */
export function digitsFromNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (!Number.isFinite(value)) return "";
  const cents = Math.round(value * 100);
  if (cents <= 0) return "";
  return String(cents);
}

/**
 * Converte digits pra número (reais) — "4850" pra 48.5. Usado pra enviar
 * pro server.
 */
export function numberFromDigits(digits: string): number | null {
  if (digits === "") return null;
  const cents = Number(digits);
  if (!Number.isFinite(cents)) return null;
  return cents / 100;
}
