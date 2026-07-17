import type { Database } from "./typings/supabase";

export type BookLanguage = Database["public"]["Enums"]["book_language"];

/** Labels PT-BR do enum book_language (mesmos textos dos forms de livro). */
export const LANGUAGE_LABELS: Record<BookLanguage, string> = {
  pt_BR: "Português (BR)",
  en: "Inglês",
  es: "Espanhol",
  fr: "Francês",
  it: "Italiano",
  de: "Alemão",
  ja: "Japonês",
  other: "Outro",
};
