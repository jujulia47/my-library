/**
 * Funções puras pra derivar metadados da série a partir dos livros e suas
 * leituras. Substitui o campo `current_book_id` que foi removido na 6.1.
 */

export type DerivedReading = {
  status: string;
  start_date: string | null;
  finish_date: string | null;
};

export type DerivedBook = {
  id: string;
  volume: number | null;
  readings: DerivedReading[];
};

export type SerieDerivedState = "reading" | "next" | "completed" | "not_started";

export type DerivedCurrentVolume<TBook extends DerivedBook> = {
  /** Há leitura em andamento ou pausada num livro da série. */
  currentReading: { book: TBook; status: "reading" | "paused" } | null;
  /** Próximo livro a ler quando nenhuma leitura está em andamento. */
  nextToRead: { book: TBook } | null;
  /** Estado geral derivado da série. */
  state: SerieDerivedState;
};

function pickLastStatus(readings: DerivedReading[]): string | null {
  if (readings.length === 0) return null;
  // Ordena por finish_date desc nulls last, depois start_date desc nulls last.
  // Replicar a regra usada nos demais derivados pra consistência.
  const sorted = [...readings].sort((a, b) => {
    const af = a.finish_date ?? "";
    const bf = b.finish_date ?? "";
    if (af !== bf) return bf.localeCompare(af);
    const as = a.start_date ?? "";
    const bs = b.start_date ?? "";
    return bs.localeCompare(as);
  });
  return sorted[0]?.status ?? null;
}

function isFinished(b: DerivedBook): boolean {
  return b.readings.some((r) => r.status === "finished");
}

/**
 * Encontra o "livro atual" / "próximo a ler" de uma série.
 *
 * Regras (em ordem de precedência):
 *  1. Se algum livro tem reading com status `reading`, esse é `currentReading`.
 *  2. Senão, se algum livro tem reading `paused`, esse é `currentReading`
 *     (ainda é "leitura atual" mesmo pausada — usuário voltará).
 *  3. Senão, se algum livro NÃO está finished e existe pelo menos UM livro
 *     finished, o primeiro livro não-finished na ordem de volume é `nextToRead`.
 *  4. Senão, se nenhum começou ainda (todos sem reading), o primeiro livro na
 *     ordem de volume é `nextToRead` (estado `not_started`).
 *  5. Se todos estão finished, `completed` — sem destaque.
 *
 * Empate por volume: livros sem volume informado vão pro fim. Quando há mais
 * de um livro com mesmo status candidato, usa o de menor volume.
 */
export function deriveCurrentVolume<TBook extends DerivedBook>(
  books: TBook[],
): DerivedCurrentVolume<TBook> {
  const sorted = [...books].sort((a, b) => {
    if (a.volume == null && b.volume == null) return 0;
    if (a.volume == null) return 1;
    if (b.volume == null) return -1;
    return a.volume - b.volume;
  });

  if (sorted.length === 0) {
    return { currentReading: null, nextToRead: null, state: "not_started" };
  }

  // 1) reading
  for (const b of sorted) {
    if (b.readings.some((r) => r.status === "reading")) {
      return {
        currentReading: { book: b, status: "reading" },
        nextToRead: null,
        state: "reading",
      };
    }
  }

  // 2) paused
  for (const b of sorted) {
    if (b.readings.some((r) => r.status === "paused")) {
      return {
        currentReading: { book: b, status: "paused" },
        nextToRead: null,
        state: "reading",
      };
    }
  }

  // 3-5) ninguém em andamento — checa se todos finished
  const allFinished = sorted.every(isFinished);
  if (allFinished) {
    return { currentReading: null, nextToRead: null, state: "completed" };
  }

  const someFinished = sorted.some(isFinished);
  // Próximo: primeiro livro não finished. Pula `abandoned` se houver mais
  // candidatos viáveis depois — abandoned não é "próximo a ler".
  const candidates = sorted.filter((b) => {
    const last = pickLastStatus(b.readings);
    return last !== "finished" && last !== "abandoned";
  });
  const next = candidates[0] ?? null;
  if (!next) {
    // Todos não-finished são abandoned; tratamos como "completed" pra UX
    // (não há próximo a indicar).
    return { currentReading: null, nextToRead: null, state: "completed" };
  }

  return {
    currentReading: null,
    nextToRead: { book: next },
    state: someFinished ? "next" : "not_started",
  };
}
