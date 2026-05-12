"use server";

import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

type PurchaseGroupUpdate = Database["public"]["Tables"]["purchase_group"]["Update"];

export type UpdatePurchaseGroupResult =
  | {
      ok: true;
      id: string;
      name: string;
      total_price: number;
      acquired_at: string | null;
    }
  | { ok: false; message: string };

/**
 * Atualiza campos editáveis de um grupo de compra. Cada campo é opcional —
 * só atualiza o que vier explícito (undefined = não mexe).
 *
 * Caso típico de uso: usuário quer setar/mudar a `acquired_at` de um box que
 * foi criado antes da feature de data, pra propagar pros livros vinculados.
 */
export async function updatePurchaseGroup(
  id: string,
  patch: {
    name?: string;
    total_price?: number;
    acquired_at?: string | null;
  },
): Promise<UpdatePurchaseGroupResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const update: PurchaseGroupUpdate = {};
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) return { ok: false, message: "Nome obrigatório." };
    update.name = trimmed;
  }
  if (patch.total_price !== undefined) {
    if (!Number.isFinite(patch.total_price) || patch.total_price < 0) {
      return { ok: false, message: "Valor inválido." };
    }
    update.total_price = patch.total_price;
  }
  if (patch.acquired_at !== undefined) {
    update.acquired_at = patch.acquired_at;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, message: "Nada pra atualizar." };
  }

  const { data, error } = await supabase
    .from("purchase_group")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, total_price, acquired_at")
    .single();
  if (error || !data) {
    return { ok: false, message: error?.message ?? "Falha ao atualizar." };
  }

  // Se o total mudou, recalcula `purchase_price` em todos os livros do grupo
  // (mesma lógica do `redistributePurchaseGroup` no `updateBookFull`). Falha
  // silenciosa — o save principal já foi efetivado.
  if (patch.total_price !== undefined) {
    const { data: books } = await supabase
      .from("book")
      .select("id")
      .eq("purchase_group_id", id)
      .order("id", { ascending: true });
    if (books && books.length > 0) {
      const total = Number(data.total_price);
      const count = books.length;
      const per = Math.round((total / count) * 100) / 100;
      const remainder = Math.round((total - per * (count - 1)) * 100) / 100;
      for (let i = 0; i < books.length; i += 1) {
        const value = i === books.length - 1 ? remainder : per;
        const { error: bookErr } = await supabase
          .from("book")
          .update({ purchase_price: value })
          .eq("id", books[i].id);
        if (bookErr) {
          console.warn(
            `[updatePurchaseGroup] redistribute book ${books[i].id} falhou:`,
            bookErr,
          );
        }
      }
    }
  }

  return {
    ok: true,
    id: data.id,
    name: data.name,
    total_price: Number(data.total_price),
    acquired_at: data.acquired_at ?? null,
  };
}
