import type { Database } from "@/utils/typings/supabase";

type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];

export type DerivedReadingStatus = ReadingStatus | "tbr" | "wont_read";

/**
 * Estados de posse em que o livro não está mais com você. Um livro que saiu
 * do acervo não tem "quero ler" (TBR) nem "não vou ler": esses status só
 * fazem sentido pra algo que você ainda tem (ou vai ter). Mesmo conjunto que
 * o BookCard usa pra esmaecer o card.
 */
export const OWNERSHIP_GONE: readonly OwnershipStatus[] = [
  "donated",
  "sold",
  "traded",
  "lost",
  "returned",
];

export function ownershipIsGone(
  ownership: OwnershipStatus | null | undefined,
): boolean {
  return !!ownership && OWNERSHIP_GONE.includes(ownership);
}

/**
 * Status de leitura pra exibição/filtro. Com leitura registrada, usa o status
 * dela. Sem leitura:
 *   - livro que você não tem mais (doado/vendido/trocado/perdido/devolvido) →
 *     `null` (sem badge de "quero ler"/"não vou ler");
 *   - senão → "wont_read" (flag) ou "tbr" (quero ler, default).
 */
export function deriveReadingStatus(
  latestStatus: ReadingStatus | null | undefined,
  wontRead: boolean | null | undefined,
  ownership: OwnershipStatus | null | undefined,
): DerivedReadingStatus | null {
  if (latestStatus) return latestStatus;
  if (ownershipIsGone(ownership)) return null;
  return wontRead ? "wont_read" : "tbr";
}
