"use server";

import { createClient } from "@/utils/supabase/server";

export type CreatePurchaseGroupResult =
  | {
      ok: true;
      id: string;
      name: string;
      total_price: number;
      acquired_at: string | null;
    }
  | { ok: false; message: string };

/**
 * Cria um grupo de compra (box/kit) com nome + valor total. Usado pelo
 * `PurchaseGroupSelect` na hora de o usuário registrar um novo box.
 * Validações mínimas — campos extras (notas, data) ficam pra edição depois.
 */
export async function createPurchaseGroup(
  name: string,
  totalPrice: number,
  acquiredAt?: string | null,
): Promise<CreatePurchaseGroupResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, message: "Informe o nome do box." };
  if (!Number.isFinite(totalPrice) || totalPrice < 0) {
    return { ok: false, message: "Valor total inválido." };
  }

  const { data, error } = await supabase
    .from("purchase_group")
    .insert({
      user_id: user.id,
      name: trimmedName,
      total_price: totalPrice,
      acquired_at: acquiredAt ?? null,
    })
    .select("id, name, total_price, acquired_at")
    .single();
  if (error || !data) {
    return { ok: false, message: error?.message ?? "Falha ao criar grupo." };
  }

  return {
    ok: true,
    id: data.id,
    name: data.name,
    total_price: Number(data.total_price),
    acquired_at: data.acquired_at ?? null,
  };
}
