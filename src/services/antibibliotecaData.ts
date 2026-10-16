import { createClient } from "@/utils/supabase/server";
import { getUserSecondsPerPage } from "@/services/readingPace";
import { ownershipIsGone } from "@/utils/readingStatus";
import type { Database } from "@/utils/typings/supabase";

type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];

/** Paleta café — cor por gênero (mesma família da impressão digital). */
const PALETTE = [
  "#6D3914",
  "#2C5078",
  "#7A4A6E",
  "#386661",
  "#9B4722",
  "#4A6B4E",
  "#8C6E1C",
  "#82393A",
];
const NO_GENRE_COLOR = "#6f5c44";

export type AntiBook = {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  pages: number | null;
  cover: string | null;
  genre: string | null;
  /** Anos parado na estante (desde que foi cadastrado). */
  years: number;
  color: string;
};

export type AntibibliotecaData = {
  books: AntiBook[];
  genres: string[];
  secondsPerPage: number;
};

type BookRow = {
  id: string;
  title: string;
  slug: string;
  cover: string | null;
  pages: number | null;
  created_at: string;
  wont_read: boolean;
  is_tbr: boolean;
  ownership_status: OwnershipStatus | null;
  // Status das leituras do livro — pra distinguir "em aberto" (lendo/pausado)
  // de "resolvido" (terminou/abandonou).
  reading: { status: ReadingStatus }[] | null;
  book_author: { author: { name: string | null } | null }[] | null;
  book_category: { category: { id: string; name: string } | null }[] | null;
};

export async function getAntibiblioteca(
  userId: string,
): Promise<AntibibliotecaData> {
  const supabase = await createClient();

  const [{ data: booksRaw }, secondsPerPage] = await Promise.all([
    supabase
      .from("book")
      .select(
        "id, title, slug, cover, pages, created_at, wont_read, is_tbr, ownership_status, reading(status), book_author(author(name)), book_category(category(id, name))",
      )
      .eq("user_id", userId),
    getUserSecondsPerPage(userId),
  ]);

  const books = (booksRaw as unknown as BookRow[] | null) ?? [];

  const now = Date.now();
  const YEAR = 365.25 * 24 * 3600 * 1000;

  // Antibiblioteca = "livros que você tem e ainda não leu": tudo que NÃO foi
  // terminado nem abandonado. Entra quem nunca começou, está lendo ou pausado;
  // sai quem terminou/abandonou. Marcado "quero ler" (is_tbr) entra sempre;
  // "não vou ler" (wont_read) e livro que saiu do acervo (doado/vendido/
  // trocado/perdido/devolvido) não entram.
  const unread = books.filter((b) => {
    if (ownershipIsGone(b.ownership_status)) return false;
    if (b.is_tbr) return true;
    if (b.wont_read) return false;
    const statuses = (b.reading ?? []).map((r) => r.status);
    const hasOpen = statuses.some((s) => s === "reading" || s === "paused");
    // Resolvido = tem leitura, mas nenhuma em aberto (só terminou/abandonou).
    const resolved = statuses.length > 0 && !hasOpen;
    return !resolved;
  });

  // Cor por gênero: gêneros presentes em ordem alfabética → paleta cíclica.
  const genreSet = new Set<string>();
  for (const b of unread) {
    const g = b.book_category?.find((bc) => bc.category)?.category?.name ?? null;
    if (g) genreSet.add(g);
  }
  const genres = [...genreSet].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const genreColor = new Map<string, string>();
  genres.forEach((g, i) => genreColor.set(g, PALETTE[i % PALETTE.length]));

  const list: AntiBook[] = unread.map((b) => {
    const genre =
      b.book_category?.find((bc) => bc.category)?.category?.name ?? null;
    const author =
      b.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null;
    const years = Math.floor((now - new Date(b.created_at).getTime()) / YEAR);
    return {
      id: b.id,
      title: b.title,
      slug: b.slug,
      author,
      pages: b.pages,
      cover: b.cover,
      genre,
      years: Math.max(0, years),
      color: genre ? genreColor.get(genre)! : NO_GENRE_COLOR,
    };
  });

  // Ordem: mais parados primeiro (a "poeira" acumulada em cima).
  list.sort((a, b) => b.years - a.years || a.title.localeCompare(b.title, "pt-BR"));

  return { books: list, genres, secondsPerPage };
}
