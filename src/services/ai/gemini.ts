import type { AIInput, AIResult, AIBookDraft } from "./types";

// Modelos em cascata: se um vier com "limit 0" (não liberado no free tier),
// 404 ou rejeitar o grounding, tenta o próximo. GEMINI_MODEL vai na frente.
const CANDIDATE_MODELS = [
  ...new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite",
      "gemini-flash-latest",
    ].filter((m): m is string => !!m),
  ),
];

const SYSTEM = `Você é um assistente bibliográfico. A partir de um ISBN, de um título/autor, ou de uma FOTO da capa/contracapa, você identifica a EDIÇÃO e a OBRA e retorna metadados bibliográficos.

MUITO IMPORTANTE — use a BUSCA NA WEB para confirmar os dados em fontes reais (catálogos de editora, livrarias, Wikipedia). NÃO responda de memória. Se houver ISBN, procure exatamente por ele (identifica a edição certa: páginas, editora e ano corretos).

Regras:
- Retorne SÓ dados bibliográficos. NUNCA invente dados pessoais/de acervo (preço, prateleira, data de compra).
- Preencha em PORTUGUÊS (sinopse e gêneros), EXCETO se a edição for estrangeira; nesse caso, o idioma da edição.
- "publication_year" = ano da PRIMEIRA publicação da OBRA original, NÃO o desta edição.
- "edition_year" = ano DESTA edição. "pages"/"publisher" = desta edição — confirme na web; se não achar a edição exata, omita esses três.
- "original_title" = título original quando difere; senão omita.
- "synopsis" = um parágrafo, sem spoilers. "categories" = 2 a 4 gêneros.
- SÉRIE: se o livro faz parte de uma série/saga, informe "series_name" (nome da série, em português se a edição for BR), "series_volume" (a posição do livro: 1, 2, 3…) e, se souber, "series_total" (total de volumes). Se for um livro único/standalone, OMITA os três.
- Se não confirmar um campo, OMITA. Precisão vale mais que completude.

FORMATO DA RESPOSTA — responda SOMENTE com um único objeto JSON válido, SEM markdown e SEM crases. Chaves possíveis (omita as que não souber):
{"title": string, "authors": [string], "language": "pt_BR"|"en"|"es"|"fr"|"it"|"de"|"ja"|"other", "publisher": string, "edition_year": number, "publication_year": number, "original_title": string, "pages": number, "synopsis": string, "categories": [string], "series_name": string, "series_volume": number, "series_total": number, "confidence": "alta"|"média"|"baixa"}
NUNCA repita as instruções nem nomes de chaves dentro de um valor. Um título tem no máximo uma linha.`;

function buildUserPrompt(input: AIInput): string {
  const lines: string[] = [];
  if (input.coverImageBase64) {
    lines.push(
      "Identifique o livro pela foto anexada (capa/contracapa) e confirme os dados buscando na web.",
    );
  } else {
    lines.push("Identifique este livro e confirme os dados buscando na web.");
  }
  if (input.isbn) lines.push(`ISBN: ${input.isbn}`);
  if (input.title) lines.push(`Título (pode estar incompleto): ${input.title}`);
  if (input.author) lines.push(`Autor: ${input.author}`);
  return lines.join("\n");
}

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

const LANG_MAP: Record<string, NonNullable<AIBookDraft["language"]>> = {
  pt_br: "pt_BR", "pt-br": "pt_BR", pt: "pt_BR", português: "pt_BR", portugues: "pt_BR",
  en: "en", inglês: "en", ingles: "en", english: "en",
  es: "es", espanhol: "es",
  fr: "fr", francês: "fr", frances: "fr",
  it: "it", italiano: "it",
  de: "de", alemão: "de", alemao: "de",
  ja: "ja", japonês: "ja", japones: "ja",
  other: "other", outro: "other",
};

/** Extrai o objeto JSON de um texto (tira crases/markdown e prosa ao redor). */
function extractJson(text: string): string | null {
  const t = text.replace(/```(?:json)?/gi, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return t.slice(start, end + 1);
}

/** Rejeita respostas degeneradas (campo curto virou blob gigante). */
function looksDegenerate(d: AIBookDraft): boolean {
  const long = (s?: string, max = 160) => !!s && s.length > max;
  if (long(d.title, 200)) return true;
  if (long(d.original_title, 200)) return true;
  if (long(d.publisher, 120)) return true;
  if (long(d.series_name, 160)) return true;
  if (d.synopsis && d.synopsis.length > 4000) return true;
  if (d.authors?.some((a) => long(a, 120))) return true;
  if (d.categories?.some((c) => long(c, 60))) return true;
  return false;
}

/** Normaliza + limpa o rascunho vindo da IA. */
function sanitize(raw: unknown): AIBookDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
  };
  const arr = (v: unknown) =>
    Array.isArray(v)
      ? (v.map((x) => str(x)).filter(Boolean) as string[])
      : undefined;

  const langRaw = str(r.language)?.toLowerCase();
  const language = langRaw ? LANG_MAP[langRaw] : undefined;

  const d: AIBookDraft = {
    title: str(r.title),
    authors: arr(r.authors),
    language,
    publisher: str(r.publisher),
    edition_year: num(r.edition_year),
    publication_year: num(r.publication_year),
    original_title: str(r.original_title),
    pages: num(r.pages),
    synopsis: str(r.synopsis),
    categories: arr(r.categories)?.slice(0, 4),
    series_name: str(r.series_name),
    series_volume: num(r.series_volume),
    series_total: num(r.series_total),
    confidence:
      r.confidence === "alta" || r.confidence === "média" || r.confidence === "baixa"
        ? r.confidence
        : undefined,
  };
  // remove chaves vazias
  const clean: AIBookDraft = {};
  for (const [k, v] of Object.entries(d)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (clean as Record<string, unknown>)[k] = v;
  }
  if (looksDegenerate(clean)) return null;
  return clean;
}

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
    // Grounding: a IA pesquisa na web antes de responder (dados reais, não de
    // memória). Não pode combinar com responseSchema, então pedimos JSON no
    // texto e fazemos parsing robusto + validação.
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.1 },
  };

  let lastMessage = "Nenhum modelo de IA disponível.";
  for (const model of CANDIDATE_MODELS) {
    const r = await callModel(model, key, body);
    if (r.ok) return { ok: true, data: r.data, provider: `gemini:${model}` };
    lastMessage = r.message;
    if (!r.tryNext) return { ok: false, message: r.message };
  }
  return { ok: false, message: lastMessage };
}

type ModelCall =
  | { ok: true; data: AIBookDraft }
  | { ok: false; message: string; tryNext: boolean };

async function callModel(
  model: string,
  key: string,
  body: unknown,
): Promise<ModelCall> {
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, message: "Falha de rede ao falar com a IA.", tryNext: false };
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = (await res.json()) as { error?: { message?: string } };
      detail = errJson?.error?.message ?? "";
    } catch {
      /* corpo não-JSON */
    }
    // 400/404 (modelo/tool não suportado) e 429 (cota) → tenta o próximo modelo.
    const tryNext = [400, 404, 429].includes(res.status);
    const prefix =
      res.status === 429
        ? `Cota do Gemini atingida (429) em ${model}.`
        : `A IA respondeu com erro (${res.status}) em ${model}.`;
    return { ok: false, tryNext, message: `${prefix}${detail ? " " + detail : ""}` };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, message: "Resposta da IA ilegível.", tryNext: true };
  }

  // Com grounding, a resposta pode ter várias parts — junta os textos.
  const partsOut =
    (json as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
      ?.candidates?.[0]?.content?.parts ?? [];
  const text = partsOut.map((p) => p.text ?? "").join("");
  if (!text.trim())
    return { ok: false, message: "A IA não retornou dados.", tryNext: true };

  const jsonStr = extractJson(text);
  if (!jsonStr)
    return { ok: false, message: "A IA não devolveu JSON.", tryNext: true };

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { ok: false, message: "A IA retornou um formato inesperado.", tryNext: true };
  }

  const clean = sanitize(parsed);
  if (!clean) {
    // resposta degenerada/vazia — tenta outro modelo.
    return {
      ok: false,
      message: "A IA devolveu uma resposta inválida — tente de novo.",
      tryNext: true,
    };
  }
  return { ok: true, data: clean };
}
