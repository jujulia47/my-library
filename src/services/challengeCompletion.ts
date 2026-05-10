import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/typings/supabase";

type Sb = SupabaseClient<Database>;

/**
 * Marca challenges como completados (`completed_at = now()`) se atingiram
 * `goal_count`. Idempotente: o `is('completed_at', null)` no WHERE evita
 * sobrescrever a data original em races/re-execuções.
 *
 * Uso: chamado em `addCollectionItem` (após inserir um book novo na coleção)
 * e em `updateReading` (quando uma reading vira `finished`). Em ambos os
 * cenários, pode ser que o usuário tenha acabado de bater a meta — e queremos
 * registrar a data exata sem depender de cálculo on-read.
 *
 * Falhas silenciosas: erros de DB são logados mas não propagam — completar
 * um challenge não é blocking pra inserção do item ou atualização da reading.
 */
export async function maybeCompleteChallenges(
  supabase: Sb,
  userId: string,
  collectionIds: string[],
): Promise<void> {
  if (collectionIds.length === 0) return;

  const { data: collections, error } = await supabase
    .from("collection")
    .select("id, type, goal_count, completed_at")
    .eq("user_id", userId)
    .eq("type", "challenge")
    .is("completed_at", null)
    .in("id", collectionIds);

  if (error || !collections) return;

  for (const col of collections) {
    if (!col.goal_count) continue;

    // Conta books distintos da coleção com pelo menos uma reading finished
    // do mesmo user. RLS já filtra por user, mas filtramos explicitamente
    // pra defesa em profundidade.
    const { data: items } = await supabase
      .from("collection_item")
      .select("book:book_id(id, reading(status, user_id))")
      .eq("collection_id", col.id)
      .not("book_id", "is", null);

    if (!items) continue;

    const finishedBookIds = new Set<string>();
    for (const it of items as unknown as Array<{
      book: {
        id: string;
        reading: { status: string; user_id: string }[] | null;
      } | null;
    }>) {
      const b = it.book;
      if (!b) continue;
      const hasFinished = b.reading?.some(
        (r) => r.status === "finished" && r.user_id === userId,
      );
      if (hasFinished) finishedBookIds.add(b.id);
    }

    if (finishedBookIds.size >= col.goal_count) {
      await supabase
        .from("collection")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", col.id)
        .is("completed_at", null);
    }
  }
}

/**
 * Variante que descobre os challenges contendo um book e tenta completar.
 * Útil em `updateReading` (sabemos só o book_id quando uma reading vira
 * finished; precisamos achar os challenges).
 */
export async function maybeCompleteChallengesForBook(
  supabase: Sb,
  userId: string,
  bookId: string,
): Promise<void> {
  const { data: items } = await supabase
    .from("collection_item")
    .select("collection_id")
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (!items || items.length === 0) return;

  const ids = [...new Set(items.map((i) => i.collection_id))];
  await maybeCompleteChallenges(supabase, userId, ids);
}
