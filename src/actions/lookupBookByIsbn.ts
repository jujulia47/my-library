"use server";

/**
 * Busca metadados de um livro a partir do ISBN, MESCLANDO várias fontes em vez
 * de parar na primeira. Estratégia:
 *
 *  1. Google Books e Open Library consultados EM PARALELO.
 *  2. Merge campo-a-campo (pega o melhor de cada): idioma/sinopse/gêneros do
 *     Google; capa preferindo a de maior resolução da Open Library.
 *  3. Título e ano de publicação ORIGINAIS via endpoint /works da Open Library
 *     (a "obra", não a edição) — é o que o Google/edição não têm.
 *
 * Cobertura de livros brasileiros nas APIs gratuitas ainda é limitada; quando
 * nada vem, o fluxo cai no preenchimento manual (ou, no futuro, na IA).
 *
 * Retorno: campos opcionais — qualquer campo sem valor vem undefined, o client
 * decide o que preencher. `publication_year` é o ano ORIGINAL da obra quando
 * disponível (senão o da edição). Authors é array de nomes.
 */

export type IsbnLookupData = {
  title?: string;
  subtitle?: string;
  authors?: string[];
  /** Já mapeado pro enum local (pt_BR, en, etc.). */
  language?: string;
  cover_url?: string;
  pages?: number;
  publisher?: string;
  /** Ano de publicação ORIGINAL da obra (fallback: ano da edição). */
  publication_year?: number;
  /** Título original da obra (quando difere do da edição). */
  original_title?: string;
  synopsis?: string;
  /** Gêneros/categorias (Google Books). */
  categories?: string[];
  /** ISBN-13 normalizado (sem hifens). */
  isbn13?: string;
};

export type IsbnLookupResult =
  | { ok: true; data: IsbnLookupData; sources: string[] }
  | { ok: false; message: string };

const LOCAL_LANGS = ["pt_BR", "en", "es", "fr", "it", "de", "ja"] as const;
type LocalLang = (typeof LOCAL_LANGS)[number] | "other";

function mapLanguage(raw: string | undefined): LocalLang | undefined {
  if (!raw) return undefined;
  const code = raw.toLowerCase().split("-")[0];
  switch (code) {
    case "pt": return "pt_BR";
    case "en": return "en";
    case "es": return "es";
    case "fr": return "fr";
    case "it": return "it";
    case "de": return "de";
    case "ja": return "ja";
    default: return "other";
  }
}

function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9X]/gi, "");
}

function yearFromDate(raw: string | undefined | null): number | undefined {
  if (!raw) return undefined;
  const m = raw.match(/(\d{4})/);
  return m ? Number(m[1]) : undefined;
}

/** Converte ISBN-10 ↔ ISBN-13. Null se não for conversível. */
function altIsbnForm(isbn: string): string | null {
  if (isbn.length === 10) {
    const core = "978" + isbn.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i += 1) sum += (i % 2 === 0 ? 1 : 3) * Number(core[i]);
    const check = (10 - (sum % 10)) % 10;
    return core + check;
  }
  if (isbn.length === 13 && isbn.startsWith("978")) {
    const core = isbn.slice(3, 12);
    let sum = 0;
    for (let i = 0; i < 9; i += 1) sum += Number(core[i]) * (10 - i);
    const mod = (11 - (sum % 11)) % 11;
    return core + (mod === 10 ? "X" : String(mod));
  }
  return null;
}

/** Primeiro valor "presente" (não vazio) de uma lista. */
function pick<T>(...vals: (T | undefined | null)[]): T | undefined {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    return v;
  }
  return undefined;
}

type Partial = {
  title?: string;
  subtitle?: string;
  authors?: string[];
  language?: string;
  cover_url?: string;
  pages?: number;
  publisher?: string;
  publication_year?: number;
  synopsis?: string;
  categories?: string[];
  isbn13?: string;
  worksKey?: string;
};

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ------------------------------- Google Books ------------------------------ */

type GoogleVolume = {
  title?: string;
  subtitle?: string;
  authors?: string[];
  language?: string;
  pageCount?: number;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  categories?: string[];
  industryIdentifiers?: { type: string; identifier: string }[];
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
};

function parseGoogle(v: GoogleVolume, fallbackIsbn: string): Partial {
  const isbn13 =
    v.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ??
    fallbackIsbn;
  const rawCover = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
  const cover_url = rawCover
    ? rawCover.replace(/^http:/, "https:").replace(/&edge=curl$/, "")
    : undefined;
  // "Fiction / Coming of Age" → ["Fiction", "Coming of Age"]
  const categories = v.categories
    ? [...new Set(v.categories.flatMap((c) => c.split("/").map((s) => s.trim())))].filter(Boolean)
    : undefined;
  return {
    title: v.title,
    subtitle: v.subtitle,
    authors: v.authors,
    language: mapLanguage(v.language),
    cover_url,
    pages: v.pageCount,
    publisher: v.publisher,
    publication_year: yearFromDate(v.publishedDate),
    synopsis: v.description,
    categories,
    isbn13: normalizeIsbn(isbn13),
  };
}

async function tryGoogle(isbn: string): Promise<Partial | null> {
  const base = "https://www.googleapis.com/books/v1/volumes?maxResults=1&q=";
  const queries = [`isbn:${isbn}`];
  const alt = altIsbnForm(isbn);
  if (alt) queries.push(`isbn:${alt}`);
  queries.push(isbn); // keyword puro — captura casos indexados sem prefixo
  for (const q of queries) {
    const json = (await getJson(base + encodeURIComponent(q))) as
      | { items?: { volumeInfo?: GoogleVolume }[] }
      | null;
    const v = json?.items?.[0]?.volumeInfo;
    if (v) return parseGoogle(v, isbn);
  }
  return null;
}

/* ------------------------------ Open Library ------------------------------ */

async function tryOpenLibrary(isbn: string): Promise<Partial | null> {
  // Endpoint "data" — traz autores (nomes), editora, capa por tamanho.
  const bib = (await getJson(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
  )) as Record<string, {
    title?: string;
    subtitle?: string;
    authors?: { name?: string }[];
    number_of_pages?: number;
    publishers?: { name?: string }[];
    publish_date?: string;
    cover?: { small?: string; medium?: string; large?: string };
  }> | null;
  const b = bib?.[`ISBN:${isbn}`];

  // Endpoint canônico — traz a chave da OBRA (works) pra ano/título original.
  const canon = (await getJson(
    `https://openlibrary.org/isbn/${isbn}.json`,
  )) as {
    title?: string;
    number_of_pages?: number;
    publish_date?: string;
    covers?: number[];
    works?: { key?: string }[];
  } | null;

  if (!b && !canon) return null;

  const coverId = canon?.covers?.[0];
  const cover_url = pick(
    b?.cover?.large,
    b?.cover?.medium,
    coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined,
  );

  return {
    title: pick(b?.title, canon?.title),
    subtitle: b?.subtitle,
    authors: b?.authors?.map((a) => a.name).filter((n): n is string => !!n),
    cover_url,
    pages: pick(b?.number_of_pages, canon?.number_of_pages),
    publisher: b?.publishers?.[0]?.name,
    publication_year: yearFromDate(pick(b?.publish_date, canon?.publish_date)),
    isbn13: normalizeIsbn(isbn),
    worksKey: canon?.works?.[0]?.key ?? undefined,
  };
}

/** A "obra" (não a edição): título e ano de publicação ORIGINAIS. */
async function fetchWork(
  worksKey: string,
): Promise<{ original_title?: string; original_year?: number }> {
  const w = (await getJson(`https://openlibrary.org${worksKey}.json`)) as {
    title?: string;
    first_publish_date?: string;
  } | null;
  if (!w) return {};
  return {
    original_title: w.title,
    original_year: yearFromDate(w.first_publish_date),
  };
}

/* --------------------------------- Merge ---------------------------------- */

export async function lookupBookByIsbn(
  rawIsbn: string,
): Promise<IsbnLookupResult> {
  const isbn = normalizeIsbn(rawIsbn);
  if (isbn.length !== 10 && isbn.length !== 13) {
    return { ok: false, message: "ISBN inválido (10 ou 13 dígitos)." };
  }

  let [google, openlib] = await Promise.all([
    tryGoogle(isbn),
    tryOpenLibrary(isbn),
  ]);

  // Se nada casou, tenta a forma alternativa do ISBN na Open Library também.
  if (!google && !openlib) {
    const alt = altIsbnForm(isbn);
    if (alt) openlib = await tryOpenLibrary(alt);
  }

  if (!google && !openlib) {
    return {
      ok: false,
      message:
        "Não achei nas bases gratuitas (comum pra livros brasileiros recentes) — preencha manualmente.",
    };
  }

  // Obra original (ano/título) — só a Open Library expõe.
  const work = openlib?.worksKey ? await fetchWork(openlib.worksKey) : {};

  const sources: string[] = [];
  if (google) sources.push("google");
  if (openlib) sources.push("openlibrary");
  if (work.original_year || work.original_title) sources.push("openlibrary-works");

  const data: IsbnLookupData = {
    title: pick(google?.title, openlib?.title),
    subtitle: pick(google?.subtitle, openlib?.subtitle),
    authors: pick(google?.authors, openlib?.authors),
    language: pick(google?.language, openlib?.language),
    // Capa: OL grande costuma ter mais resolução que o thumbnail do Google.
    cover_url: pick(openlib?.cover_url, google?.cover_url),
    pages: pick(google?.pages, openlib?.pages),
    publisher: pick(google?.publisher, openlib?.publisher),
    // Ano: prioriza o ORIGINAL da obra; senão o da edição.
    publication_year: pick(
      work.original_year,
      google?.publication_year,
      openlib?.publication_year,
    ),
    original_title: work.original_title,
    synopsis: pick(google?.synopsis),
    categories: pick(google?.categories),
    isbn13: pick(google?.isbn13, openlib?.isbn13, isbn),
  };

  return { ok: true, data, sources };
}
