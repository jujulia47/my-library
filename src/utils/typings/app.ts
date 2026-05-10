import type { Database } from "./supabase";

type BookRow = Database["public"]["Tables"]["book"]["Row"];
type SerieRow = Database["public"]["Tables"]["serie"]["Row"];
type QuoteRow = Database["public"]["Tables"]["quote"]["Row"];
type ReadingRow = Database["public"]["Tables"]["reading"]["Row"];

// Nota: a quote agora usa o tipo nativo `Database["public"]["Tables"]["quote"]["Row"]`
// direto. O `QuoteWithLegacyShape` foi removido junto com o flow antigo (sessão 8).
// `CollectionWithLegacyShape` foi removido na sessão 9.1 junto com o flow antigo
// de coleção; tudo agora usa `CollectionListItem` de `@/services/collectionList`.

// Forma "achatada" usada pelos componentes de UI: os campos antigos
// (author/status/init_date/etc.) ficam expostos no topo do objeto pra evitar
// reescrever todos os componentes nesta sessão.
export type BookWithLegacyShape = BookRow & {
  author: string;
  status: string | null;
  init_date: string | null;
  finish_date: string | null;
  current_page: number | null;
  rating: number | null;
  reading?: ReadingRow[] | null;
  serie?: SerieRow | null;
  quote?: QuoteRow[];
};

export type SerieWithLegacyShape = SerieRow & {
  serie_name: string | null;
  init_date: string | null;
  // book pode ser objeto único (livro corrente) ou array (livros da série),
  // dependendo do contexto da query.
  book?: unknown;
};

export type RereadingLegacyShape = ReadingRow & {
  date_started: string | null;
  date_finished: string | null;
};
