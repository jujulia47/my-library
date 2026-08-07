"use server";

import { createReading } from "./createReading";
import { todayISO } from "@/utils/readingEvents";
import type { ActionResult } from "@/utils/translateSupabaseError";

/**
 * Começa a ler um livro da antibiblioteca: cria uma reading `reading` iniciada
 * hoje. Reusa `createReading`, então já registra o evento `started` e ancora o
 * livro no plano do dia ("Hoje na sua mesa"), como começar pela fila.
 */
export async function startReadingBook(
  bookId: string,
  bookSlug: string | null,
): Promise<ActionResult> {
  const fd = new FormData();
  fd.set("book_id", bookId);
  fd.set("status", "reading");
  fd.set("start_date", todayISO());
  if (bookSlug) fd.set("book_slug", bookSlug);
  return createReading(fd);
}
