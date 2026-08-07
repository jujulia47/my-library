import type { AIInput, AIResult } from "./types";
import { geminiCompleteBook } from "./gemini";

export type { AIInput, AIResult, AIBookDraft } from "./types";

/**
 * Portinha ÚNICA de IA. Todo o app fala só com esta função; trocar de provedor
 * (Gemini → Claude, etc.) é mudar só aqui, via env AI_PROVIDER. Hoje: Gemini
 * (free tier). Amanhã, é plugar `claudeCompleteBook` no switch.
 */
export async function aiCompleteBook(input: AIInput): Promise<AIResult> {
  const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  switch (provider) {
    case "gemini":
      return geminiCompleteBook(input);
    default:
      return {
        ok: false,
        message: `Provedor de IA desconhecido: ${provider}.`,
      };
  }
}
