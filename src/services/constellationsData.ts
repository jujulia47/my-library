import { createClient } from "@/utils/supabase/server";

/** Cores de gênero que lêem bem no céu escuro. */
const PALETTE = [
  "#8a5a2c", "#5a86bf", "#a06fa0", "#4f8f88",
  "#b1585a", "#c06a3e", "#6f9a58", "#7a6cae",
];

export const WORLD_W = 1600;
export const WORLD_H = 1000;

export type ConstellationStar = {
  title: string;
  author: string | null;
  slug: string;
  pages: number | null;
  rating: number | null;
  x: number;
  y: number;
  size: number;
  bright: number;
  phase: number;
};

export type Constellation = {
  name: string;
  /** Cor base do gênero. */
  color: string;
  /** Cor clara da estrela/linha (base + branco). */
  star: string;
  cx: number;
  cy: number;
  stars: ConstellationStar[];
};

export type ConstellationsData = {
  genres: Constellation[];
  bookCount: number;
};

type ReadingRow = {
  rating: number | null;
  book: {
    id: string;
    title: string;
    slug: string;
    pages: number | null;
    book_author: { author: { name: string | null } | null }[] | null;
    book_category: { category: { name: string } | null }[] | null;
  } | null;
};

// PRNG determinístico (mesmo do mockup) — layout estável entre renders.
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function toRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixHex(h: string, t: string, a: number): string {
  const A = toRgb(h);
  const B = toRgb(t);
  const hx = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return "#" + [0, 1, 2].map((i) => hx(A[i] + (B[i] - A[i]) * a)).join("");
}

export async function getConstellations(
  userId: string,
): Promise<ConstellationsData> {
  const supabase = await createClient();

  const { data: readingsRaw } = await supabase
    .from("reading")
    .select(
      "rating, book:book_id(id, title, slug, pages, book_author(author(name)), book_category(category(name)))",
    )
    .eq("user_id", userId)
    .eq("status", "finished");

  const readings = (readingsRaw as unknown as ReadingRow[] | null) ?? [];

  // Um livro por estrela (dedup por id). Gênero = primeira categoria; sem
  // categoria vai pra "Sem gênero".
  type Book = {
    title: string;
    author: string | null;
    slug: string;
    pages: number | null;
    rating: number | null;
    genre: string;
  };
  const seen = new Map<string, Book>();
  for (const r of readings) {
    if (!r.book) continue;
    const existing = seen.get(r.book.id);
    if (existing) {
      // Mantém a nota já registrada; completa se faltava.
      if (existing.rating == null && r.rating != null) existing.rating = r.rating;
      continue;
    }
    const genre =
      r.book.book_category?.find((bc) => bc.category)?.category?.name ??
      "Sem gênero";
    const author =
      r.book.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null;
    seen.set(r.book.id, {
      title: r.book.title,
      author,
      slug: r.book.slug,
      pages: r.book.pages,
      rating: r.rating,
      genre,
    });
  }

  // Agrupa por gênero.
  const byGenre = new Map<string, Book[]>();
  for (const b of seen.values()) {
    (byGenre.get(b.genre) ?? byGenre.set(b.genre, []).get(b.genre)!).push(b);
  }
  // Ordena: mais livros primeiro; "Sem gênero" por último.
  const entries = [...byGenre.entries()].sort((a, z) => {
    if (a[0] === "Sem gênero") return 1;
    if (z[0] === "Sem gênero") return -1;
    return z[1].length - a[1].length;
  });

  const N = entries.length;
  const genres: Constellation[] = entries.map(([name, books], gi) => {
    // Centro do gênero: distribuídos numa elipse ao redor do centro do mundo.
    let cx = WORLD_W / 2;
    let cy = WORLD_H / 2;
    if (N > 1) {
      const ang = -Math.PI / 2 + (gi / N) * Math.PI * 2;
      cx = WORLD_W / 2 + Math.cos(ang) * 560;
      cy = WORLD_H / 2 + Math.sin(ang) * 330;
    }
    const color = PALETTE[gi % PALETTE.length];

    // Caminhada semeada a partir do centro (posições estáveis das estrelas).
    const r = rng(gi * 999 + 7);
    let x = cx;
    let y = cy;
    let a = r() * 6.28;
    const stars: ConstellationStar[] = books.map((b, i) => {
      if (i > 0) {
        a += (r() - 0.5) * 2.2;
        const step = 60 + r() * 70;
        x += Math.cos(a) * step;
        y += Math.sin(a) * step;
      }
      const pages = b.pages ?? 220;
      const bright =
        b.rating != null
          ? 0.5 + Math.max(0, Math.min(1, (b.rating - 3) / 2)) * 0.5
          : 0.55;
      return {
        title: b.title,
        author: b.author,
        slug: b.slug,
        pages: b.pages,
        rating: b.rating,
        x,
        y,
        phase: r() * 6.28,
        size: 2.6 + Math.min(6, pages / 220),
        bright,
      };
    });

    return {
      name,
      color,
      star: mixHex(color, "#ffffff", 0.5),
      cx,
      cy,
      stars,
    };
  });

  return { genres, bookCount: seen.size };
}
