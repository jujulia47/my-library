"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import { ALL_SHELF_SYMBOLS, type ShelfSymbol } from "@/services/libraryData";

/**
 * Cria uma nova estante no fim da fila do user. Símbolo é o primeiro da lista
 * de 8 símbolos que ainda não está em uso pelo user; se todos os 8 já foram
 * usados, recicla a partir do início (espera-se que isso seja raro).
 */
export async function createShelf(): Promise<
  ActionResult<{ id: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: existing } = await supabase
    .from("shelf")
    .select("ordering, symbol")
    .eq("user_id", user.id)
    .order("ordering", { ascending: false });

  const nextOrdering = (existing?.[0]?.ordering ?? -1) + 1;
  const used = new Set((existing ?? []).map((s) => s.symbol));
  const nextSymbol: ShelfSymbol =
    ALL_SHELF_SYMBOLS.find((s) => !used.has(s)) ?? "moon";

  const { data, error } = await supabase
    .from("shelf")
    .insert({
      user_id: user.id,
      ordering: nextOrdering,
      symbol: nextSymbol,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, ...translateSupabaseError(error) };
  }

  revalidatePath("/library");
  return { ok: true, data: { id: data.id } };
}
