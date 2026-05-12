"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import type { Database } from "@/utils/typings/supabase";

type SubscriptionUpdate = Database["public"]["Tables"]["subscription"]["Update"];

/**
 * Atualiza campos editáveis de uma assinatura. Usado pra setar/mudar
 * `monthly_price` sem precisar de uma page dedicada — a SubscriptionSelect
 * permite editar inline depois de criada.
 *
 * Mudar `monthly_price` NÃO afeta livros já cadastrados — cada livro tem
 * snapshot do preço em `book.purchase_price`. Só novas seleções pegam o
 * valor atualizado.
 */
export async function updateSubscription(
  id: string,
  patch: {
    name?: string;
    notes?: string | null;
    monthly_price?: number | null;
  },
): Promise<
  ActionResult<{ id: string; name: string; monthly_price: number | null }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const update: SubscriptionUpdate = {};
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) return { ok: false, message: "Nome obrigatório." };
    update.name = trimmed;
  }
  if (patch.notes !== undefined) {
    update.notes = patch.notes?.trim() || null;
  }
  if (patch.monthly_price !== undefined) {
    if (patch.monthly_price === null) {
      update.monthly_price = null;
    } else if (
      !Number.isFinite(patch.monthly_price) ||
      patch.monthly_price < 0
    ) {
      return { ok: false, message: "Valor mensal inválido." };
    } else {
      update.monthly_price = patch.monthly_price;
    }
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, message: "Nada pra atualizar." };
  }

  const { data, error } = await supabase
    .from("subscription")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, monthly_price")
    .single();
  if (error || !data) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/book");
  return {
    ok: true,
    data: {
      id: data.id,
      name: data.name,
      monthly_price:
        data.monthly_price !== null ? Number(data.monthly_price) : null,
    },
  };
}
