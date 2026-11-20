"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Cria uma pessoa da casa (dono possível de livros). Usada inline no seletor
 * de "Dono" do cadastro. Nome único por conta (constraint no banco).
 */
export async function createPerson(
  name: string,
): Promise<ActionResult<{ id: string; name: string }>> {
  const trimmed = (name ?? "").trim();
  if (!trimmed)
    return { ok: false, message: "Nome da pessoa obrigatório.", field: "name" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data, error } = await supabase
    .from("person")
    .insert({ user_id: user.id, name: trimmed })
    .select("id, name")
    .single();
  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/book");
  return { ok: true, data: data as { id: string; name: string } };
}
