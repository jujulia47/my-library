import type { AIInput, AIResult, AIBookDraft } from "./types";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

const SYSTEM = `Você é um assistente bibliográfico especializado em livros. A partir de um ISBN, de um título/autor, ou de uma FOTO da capa/contracapa, você identifica a EDIÇÃO e a OBRA e retorna APENAS metadados bibliográficos.

Regras rígidas:
- Retorne SÓ os campos bibliográficos do schema. NUNCA invente dados pessoais/de acervo (preço, prateleira, data de compra) — eles não existem aqui.
- Preencha em PORTUGUÊS (sinopse e gêneros), EXCETO se a edição for estrangeira (não brasileira nem portuguesa); nesse caso use o idioma da edição.
- "publication_year" = ano da PRIMEIRA publicação da OBRA original, NÃO o ano desta edição.
- "edition_year" = ano DESTA edição/impressão.
- "original_title" = título original da obra quando diferente do título da edição; senão omita.
- "language" = idioma DESTA edição.
- "pages" = número de páginas desta edição.
- "synopsis" = um parágrafo, sem spoilers.
- "categories" = 2 a 4 gêneros/categorias.
- Se NÃO tiver certeza de um campo, OMITA — prefira precisão a completude, nunca invente.
- Se for uma foto e você não reconhecer o livro com segurança, use confidence "baixa".`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    authors: { type: "ARRAY", items: { type: "STRING" } },
    language: {
      type: "STRING",
      enum: ["pt_BR", "en", "es", "fr", "it", "de", "ja", "other"],
    },
    publisher: { type: "STRING" },
    edition_year: { type: "INTEGER" },
    publication_year: { type: "INTEGER" },
    original_title: { type: "STRING" },
    pages: { type: "INTEGER" },
    synopsis: { type: "STRING" },
    categories: { type: "ARRAY", items: { type: "STRING" } },
    confidence: { type: "STRING", enum: ["alta", "média", "baixa"] },
  },
} as const;

function buildUserPrompt(input: AIInput): string {
  const lines: string[] = [];
  if (input.coverImageBase64) {
    lines.push(
      "Identifique o livro pela foto anexada (capa e/ou contracapa) e complete os metadados bibliográficos.",
    );
  } else {
    lines.push("Complete os metadados bibliográficos deste livro.");
  }
  if (input.isbn) lines.push(`ISBN: ${input.isbn}`);
  if (input.title) lines.push(`Título (pode estar incompleto): ${input.title}`);
  if (input.author) lines.push(`Autor: ${input.author}`);
  const known = input.known ?? {};
  const knownKeys = Object.entries(known).filter(
    ([, v]) => v !== undefined && v !== null && (!Array.isArray(v) || v.length),
  );
  if (knownKeys.length) {
    lines.push(
      `Já sei (não precisa repetir, mas use como contexto): ${knownKeys
        .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ")}.`,
    );
  }
  return lines.join("\n");
}

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

/** Implementação Gemini da portinha de IA. Usa a API REST (free tier). */
export async function geminiCompleteBook(input: AIInput): Promise<AIResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      ok: false,
      message:
        "IA não configurada: defina GEMINI_API_KEY no .env.local (chave gratuita do Google AI Studio).",
    };
  }

  const parts: GeminiPart[] = [{ text: buildUserPrompt(input) }];
  if (input.coverImageBase64) {
    parts.push({
      inline_data: {
        mime_type: input.coverMimeType ?? "image/jpeg",
        data: input.coverImageBase64,
      },
    });
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  };

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, message: "Falha de rede ao falar com a IA." };
  }

  if (!res.ok) {
    if (res.status === 429)
      return { ok: false, message: "Cota da IA esgotada por agora — tente mais tarde." };
    return {
      ok: false,
      message: `A IA respondeu com erro (${res.status}). Verifique a chave/API.`,
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, message: "Resposta da IA ilegível." };
  }

  const text = (
    json as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { ok: false, message: "A IA não retornou dados." };

  let parsed: AIBookDraft;
  try {
    parsed = JSON.parse(text) as AIBookDraft;
  } catch {
    return { ok: false, message: "A IA retornou um formato inesperado." };
  }

  // Sanitiza: descarta strings vazias e arrays vazios.
  const clean: AIBookDraft = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (clean as Record<string, unknown>)[k] = v;
  }

  return { ok: true, data: clean, provider: "gemini" };
}
