/**
 * Cálculo das datas derivadas de uma série a partir das leituras dos seus
 * livros. Função pura — recebe os livros já carregados (com `readings`) e
 * devolve as datas. UI consumidora pode aplicar override manual de
 * `serie.start_date`/`serie.finish_date` por cima.
 */

export type SerieDateInput = {
  /** Pelo menos um campo de reading por livro pra calcular. `updated_at`
   *  é necessário pro cálculo de "última atividade". */
  readings: {
    status: string;
    start_date: string | null;
    finish_date: string | null;
    updated_at?: string | null;
  }[];
};

export type DerivedSerieDates = {
  /** MIN(start_date) de todas as readings, ou null. */
  derivedStartDate: string | null;
  /** MAX(finish_date) das readings finished, **só** quando todos os livros
   *  da série têm pelo menos uma reading finished. Caso contrário, null
   *  (a série ainda não foi concluída). */
  derivedFinishDate: string | null;
  /** MAX(reading.updated_at) das readings da série. Reflete a última
   *  interação do usuário (mudou status, página, rating, etc.). */
  derivedLastActivity: string | null;
};

function maxNullable(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function minNullable(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

export function deriveSerieDates(books: SerieDateInput[]): DerivedSerieDates {
  let derivedStartDate: string | null = null;
  let derivedLastActivity: string | null = null;
  const finishedFinishDatesPerBook: (string | null)[] = [];

  for (const book of books) {
    let bookHasFinished = false;
    let bookMaxFinish: string | null = null;
    for (const r of book.readings) {
      derivedStartDate = minNullable(derivedStartDate, r.start_date);
      // last_activity = MAX(reading.updated_at). Se updated_at não veio
      // (chamadas legadas que só passam start/finish), cai pro fallback
      // antigo de start/finish — mantém compatibilidade.
      if (r.updated_at !== undefined && r.updated_at !== null) {
        derivedLastActivity = maxNullable(derivedLastActivity, r.updated_at);
      } else {
        derivedLastActivity = maxNullable(derivedLastActivity, r.start_date);
        derivedLastActivity = maxNullable(derivedLastActivity, r.finish_date);
      }
      if (r.status === "finished") {
        bookHasFinished = true;
        bookMaxFinish = maxNullable(bookMaxFinish, r.finish_date);
      }
    }
    finishedFinishDatesPerBook.push(bookHasFinished ? bookMaxFinish : null);
  }

  // derivedFinishDate só vale se TODOS os livros têm pelo menos uma reading
  // finished. Lista vazia também conta como "não concluída".
  const allFinished =
    books.length > 0 && finishedFinishDatesPerBook.every((d) => d !== null);
  const derivedFinishDate = allFinished
    ? finishedFinishDatesPerBook.reduce<string | null>(
        (acc, d) => maxNullable(acc, d),
        null,
      )
    : null;

  return { derivedStartDate, derivedFinishDate, derivedLastActivity };
}

/**
 * Aplica override do form (`serie.start_date`/`serie.finish_date`) em cima
 * dos derivados. Quando o override é null/undefined, usa o derivado.
 */
export function resolveSerieDates(
  derived: DerivedSerieDates,
  override: { start_date: string | null; finish_date: string | null },
) {
  return {
    startDate: override.start_date ?? derived.derivedStartDate,
    finishDate: override.finish_date ?? derived.derivedFinishDate,
    lastActivity: derived.derivedLastActivity,
  };
}
