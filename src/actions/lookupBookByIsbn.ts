"use server";

/**
 * Busca metadados de um livro a partir do ISBN. Estratégia em cascata
 * por causa de cobertura limitada de livros brasileiros nas APIs gratuitas:
 *
 *  1. Google Books com `isbn:` prefix
 *  2. Google Books com a forma alternativa (ISBN-13 ↔ ISBN-10)
 *  3. Google Books como keyword puro (sem prefix)
 *  4. Open Library — endpoint /api/books?bibkeys=
 *  5. Open Library — endpoint canônico /isbn/{isbn}.json
 *
 * Retorno: campos opcionais — qualquer campo que a API não tenha vem como
 * undefined, o client decide o que preencher. Authors é array de strings
 * (o client cria/encontra cada autor depois via createAuthor).
 */

export type IsbnLookupResult =
  | {
      ok: true;
      data: {
        title?: string;
        subtitle?: string;
        authors?: string[];
        /** Já mapeado pro enum local (pt_BR, en, etc.). */
        language?: string;
        cover_url?: string;
        pages?: number;
        publisher?: string;
        /** Year only (number), even quando a API retorna data completa. */
        publication_year?: number;
        /** ISBN-13 normalizado (sem hifens). */
        isbn13?: string;
      };
      source: "google" | "openlibrary";
    }
  | { ok: false; message: string };

const LOCAL_LANGS = ["pt_BR", "en", "es", "fr", "it", "de", "ja"] as const;
type LocalLang = (typeof LOCAL_LANGS)[number] | "other";

function mapLanguage(raw: string | undefined): LocalLang | undefined {
  if (!raw) return undefined;
  const code = raw.toLowerCase().split("-")[0];
  switch (code) {
    case "pt":
      return "pt_BR";
    case "en":
      return "en";
    case "es":
      return "es";
    case "fr":
      return "fr";
    case "it":
      return "it";
    case "de":
      return "de";
    case "ja":
      return "ja";
    default:
      return "other";
  }
}

function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9X]/gi, "");
}

function yearFromDate(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const m = raw.match(/^(\d{4})/);
  return m ? Number(m[1]) : undefined;
}

/**
 * Converte ISBN-10 ↔ ISBN-13. Devolve null se a entrada não for um ISBN
 * válido conversível (ex.: ISBN-13 que não começa com 978/979, ou ISBN-10
 * com check digit X que precisa ser preservado).
 */
function altIsbnForm(isbn: string): string | null {
  if (isbn.length === 10) {
    // ISBN-10 → ISBN-13 (prepend "978" + recalcula check digit)
    const core = "978" + isbn.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i += 1) {
      const d = Number(core[i]);
      sum += i % 2 === 0 ? d : d * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return core + check;
  }
  if (isbn.length === 13 && isbn.startsWith("978")) {
    // ISBN-13 (978) → ISBN-10 (drop prefix + recalcula check digit)
    const core = isbn.slice(3, 12);
    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
      sum += Number(core[i]) * (10 - i);
    }
    const mod = (11 - (sum % 11)) % 11;
    const check = mod === 10 ? "X" : String(mod);
    return core + check;
  }
  return null;
}

type GoogleBooksJson = {
  totalItems?: number;
  items?: Array<{
    volumeInfo?: {
      title?: string;
      subtitle?: string;
      authors?: string[];
      language?: string;
      pageCount?: number;
      publisher?: string;
      publishedDate?: string;
      industryIdentifiers?: Array<{ type: string; identifier: string }>;
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    };
  }>;
};

async function googleBooksQuery(
  query: string,
  fallbackIsbn: string,
): Promise<IsbnLookupResult | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query,
  )}&maxResults=1`;
  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 0 } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const json = (await res.json()) as GoogleBooksJson;
  if (!json.items || json.items.length === 0) return null;
  const v = json.items[0]?.volumeInfo;
  if (!v) return null;

  const isbn13Found =
    v.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ??
    fallbackIsbn;

  // Google retorna URL com http:// — força https + tira `&edge=curl` ruidoso
  const rawCover = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
  const cover_url = rawCover
    ? rawCover.replace(/^http:/, "https:").replace(/&edge=curl$/, "")
    : undefined;

  return {
    ok: true,
    source: "google",
    data: {
      title: v.title,
      subtitle: v.subtitle,
      authors: v.authors,
      language: mapLanguage(v.language),
      cover_url,
      pages: v.pageCount,
      publisher: v.publisher,
      publication_year: yearFromDate(v.publishedDate),
      isbn13: normalizeIsbn(isbn13Found),
    },
  };
}

async function tryGoogleBooks(
  isbn: string,
): Promise<IsbnLookupResult | null> {
  // 1. ISBN exato
  let r = await googleBooksQuery(`isbn:${isbn}`, isbn);
  if (r) return r;

  // 2. Forma alternativa (ISBN-10 ↔ ISBN-13)
  const alt = altIsbnForm(isbn);
  if (alt) {
    r = await googleBooksQuery(`isbn:${alt}`, isbn);
    if (r) return r;
  }

  // 3. Keyword puro — captura casos onde Google indexou mas não como ISBN
  r = await googleBooksQuery(isbn, isbn);
  return r;
}

async function tryOpenLibraryBibkeys(
  isbn: string,
): Promise<IsbnLookupResult | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`;
  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 0 } });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const json = (await res.json()) as Record<
    string,
    {
      title?: string;
      subtitle?: string;
      authors?: Array<{ name?: string }>;
      number_of_pages?: number;
      publishers?: Array<{ name?: string }>;
      publish_date?: string;
      cover?: { small?: string; medium?: string; large?: string };
    }
  >;
  const v = json[`ISBN:${isbn}`];
  if (!v) return null;

  return {
    ok: true,
    source: "openlibrary",
    data: {
      title: v.title,
      subtitle: v.subtitle,
      authors: v.authors?.map((a) => a.name).filter((n): n is string => !!n),
      language: undefined,
      cover_url: v.cover?.large ?? v.cover?.medium ?? v.cover?.small,
      pages: v.number_of_pages,
      publisher: v.publishers?.[0]?.name,
      publication_year: yearFromDate(v.publish_date),
      isbn13: normalizeIsbn(isbn),
    },
  };
}

async function tryOpenLibraryCanonical(
  isbn: string,
): Promise<IsbnLookupResult | null> {
  // Endpoint canônico — retorna 404 se não encontrar (em vez de objeto vazio).
  const url = `https://openlibrary.org/isbn/${isbn}.json`;
  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 0 } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const v = (await res.json()) as {
    title?: string;
    subtitle?: string;
    publishers?: string[];
    publish_date?: string;
    number_of_pages?: number;
    covers?: number[];
    authors?: Array<{ key?: string }>;
    by_statement?: string;
  };

  // Authors aqui vêm como referências — extrair nome via by_statement
  // (string solta) é o que dá pra fazer sem fazer N requests adicionais.
  let authors: string[] | undefined;
  if (v.by_statement) {
    authors = v.by_statement
      .replace(/^by /i, "")
      .split(/,| and /i)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const coverId = v.covers?.[0];
  const cover_url = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : undefined;

  return {
    ok: true,
    source: "openlibrary",
    data: {
      title: v.title,
      subtitle: v.subtitle,
      authors,
      language: undefined,
      cover_url,
      pages: v.number_of_pages,
      publisher: v.publishers?.[0],
      publication_year: yearFromDate(v.publish_date),
      isbn13: normalizeIsbn(isbn),
    },
  };
}

async function tryOpenLibrary(isbn: string): Promise<IsbnLookupResult | null> {
  const a = await tryOpenLibraryBibkeys(isbn);
  if (a) return a;
  const b = await tryOpenLibraryCanonical(isbn);
  return b;
}

export async function lookupBookByIsbn(
  rawIsbn: string,
): Promise<IsbnLookupResult> {
  const isbn = normalizeIsbn(rawIsbn);
  if (isbn.length !== 10 && isbn.length !== 13) {
    return { ok: false, message: "ISBN inválido (10 ou 13 dígitos)." };
  }

  const google = await tryGoogleBooks(isbn);
  if (google && google.ok) return google;

  const ol = await tryOpenLibrary(isbn);
  if (ol && ol.ok) return ol;

  // Tenta também a forma alternativa no Open Library
  const alt = altIsbnForm(isbn);
  if (alt) {
    const olAlt = await tryOpenLibrary(alt);
    if (olAlt && olAlt.ok) return olAlt;
  }

  return {
    ok: false,
    message:
      "Não achei nas bases gratuitas (comum pra livros brasileiros recentes) — preencha manualmente.",
  };
}
