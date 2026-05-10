"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Chama o RPC `seed_default_categories()` (sem args, usa `auth.uid()`
 * internamente — sessão 17.1). Antes desta sessão, o RPC tinha assinatura
 * `seed_default_categories(p_user_id uuid)` e o client passava o id, o que
 * gerava um TypeError quando o RPC foi alterado e a chamada não foi
 * atualizada. Agora os tipos refletem `Args: never` e a chamada é vazia.
 */
export async function seedDefaultCategories(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { error } = await supabase.rpc("seed_default_categories");

  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/category");
  return { ok: true };
}
