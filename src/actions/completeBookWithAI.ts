"use server";

import { createClient } from "@/utils/supabase/server";
import { aiCompleteBook, type AIInput, type AIResult } from "@/services/ai";

/**
 * Ação server que fala com a portinha de IA (Gemini free tier hoje). Autenticada
 * pra não virar proxy aberto pra IA. A chave nunca sai do servidor.
 */
export async function completeBookWithAI(input: AIInput): Promise<AIResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  return aiCompleteBook(input);
}
