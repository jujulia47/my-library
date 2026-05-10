"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Cria uma nova assinatura. Trim no nome, dedup case-insensitive (já há
 * unique index `subscription_user_name_idx` em (user_id, lower(name))).
 * Erro de duplicata sobe via translateSupabaseError pro form.
 */
export async function createSubscription(params: {
  name: string;
  notes?: string | null;
}): Promise<ActionResult<{ id: string; name: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const trimmed = params.name.trim();
  if (!trimmed) {
    return { ok: false, message: "Nome obrigatório.", field: "name" };
  }

  // Defesa em profundidade: detecta duplicata case-insensitive antes de
  // depender da constraint (mensagem amigável imediata).
  const { data: existing } = await supabase
    .from("subscription")
    .select("id, name")
    .eq("user_id", user.id)
    .ilike("name", trimmed)
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      message: `Você já tem uma assinatura "${existing.name}".`,
      field: "name",
    };
  }

  const { data, error } = await supabase
    .from("subscription")
    .insert({
      user_id: user.id,
      name: trimmed,
      notes: params.notes?.trim() || null,
    })
    .select("id, name")
    .single();

  if (error || !data) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/book");
  return { ok: true, data: { id: data.id, name: data.name } };
}
