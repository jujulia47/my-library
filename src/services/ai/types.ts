/** Contrato da "portinha única" de IA — trocar de provedor não muda o resto. */

export type AIBookDraft = {
  title?: string;
  authors?: string[];
  /** Idioma DESTA edição, já no enum local. */
  language?: "pt_BR" | "en" | "es" | "fr" | "it" | "de" | "ja" | "other";
  publisher?: string;
  /** Ano DESTA edição. */
  edition_year?: number;
  /** Ano da PRIMEIRA publicação da obra (original). */
  publication_year?: number;
  /** Título original da obra (quando difere do da edição). */
  original_title?: string;
  pages?: number;
  /** Sinopse em português (ou no idioma da edição, se estrangeira). */
  synopsis?: string;
  /** 2 a 4 gêneros/categorias em português. */
  categories?: string[];
  isbn13?: string;
  confidence?: "alta" | "média" | "baixa";
};

export type AIInput = {
  isbn?: string;
  title?: string;
  author?: string;
  /** Foto da capa/contracapa em base64 (sem o prefixo data:). */
  coverImageBase64?: string;
  coverMimeType?: string;
  /** O que as APIs já trouxeram — a IA só completa o que falta. */
  known?: Partial<AIBookDraft>;
};

export type AIResult =
  | { ok: true; data: AIBookDraft; provider: string }
  | { ok: false; message: string };
