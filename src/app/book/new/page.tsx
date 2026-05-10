import AppShell from "@/components/AppShell";
import BookMinimal from "@/components/Create/BookMinimal";
import { createClient } from "@/utils/supabase/server";
import { createAuthor } from "@/actions/createAuthor";
import type { SerieOption, AuthorOption } from "@/components/ui";

export default async function NewBookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const serieIdRaw = Array.isArray(sp.serie_id) ? sp.serie_id[0] : sp.serie_id;
  const volumeRaw = Array.isArray(sp.volume) ? sp.volume[0] : sp.volume;
  const fromWishlistRaw = Array.isArray(sp.from_wishlist)
    ? sp.from_wishlist[0]
    : sp.from_wishlist;
  const authorIdRaw = Array.isArray(sp.author_id)
    ? sp.author_id[0]
    : sp.author_id;
  const titleRaw = Array.isArray(sp.title) ? sp.title[0] : sp.title;

  let initialSerie: SerieOption | null = null;
  let initialSerieSlug: string | null = null;
  let initialSerieOccupiedVolumes: number[] = [];

  if (serieIdRaw) {
    const supabase = await createClient();
    const { data: serieRow } = await supabase
      .from("serie")
      .select("id, name, slug")
      .eq("id", serieIdRaw)
      .maybeSingle();
    if (serieRow) {
      initialSerie = { id: serieRow.id, name: serieRow.name };
      initialSerieSlug = serieRow.slug;

      // Volumes ocupados — alimenta o LinkBookToSerieModal pra sugerir o
      // próximo volume disponível.
      const { data: occupiedRows } = await supabase
        .from("book")
        .select("volume")
        .eq("serie_id", serieRow.id)
        .not("volume", "is", null);
      initialSerieOccupiedVolumes = (occupiedRows ?? [])
        .map((r) => r.volume)
        .filter((v): v is number => typeof v === "number");
    }
  }

  // "Marcar como adquirido": pré-preenche título e (se presente) autor.
  let fromWishlist: { id: string; title: string } | null = null;
  let initialAuthors: AuthorOption[] | undefined;
  if (fromWishlistRaw) {
    const supabase = await createClient();
    const { data: wlRow } = await supabase
      .from("wishlist")
      .select("id, title, author_name")
      .eq("id", fromWishlistRaw)
      .maybeSingle();
    // RLS garante que só vamos ler item do próprio user.
    if (wlRow) {
      fromWishlist = { id: wlRow.id, title: wlRow.title };
      if (wlRow.author_name?.trim()) {
        const result = await createAuthor(wlRow.author_name.trim());
        if (result.ok) {
          initialAuthors = [{ id: result.id, name: result.name }];
        }
      }
    }
  }

  const initialVolume = volumeRaw ? Number(volumeRaw) || null : null;

  // ?author_id= (vindo do detail page do autor) — pré-seleciona o autor.
  // Não sobrescreve initialAuthors caso já tenha vindo via from_wishlist.
  if (authorIdRaw && !initialAuthors) {
    const supabase = await createClient();
    const { data: authorRow } = await supabase
      .from("author")
      .select("id, name")
      .eq("id", authorIdRaw)
      .maybeSingle();
    if (authorRow) {
      initialAuthors = [{ id: authorRow.id, name: authorRow.name }];
    }
  }

  // ?title= (vindo de bibliography "não tenho") — pré-preenche título.
  const initialTitle = typeof titleRaw === "string" ? titleRaw : undefined;

  return (
    <AppShell>
      <BookMinimal
        initialSerie={initialSerie}
        initialSerieSlug={initialSerieSlug}
        initialSerieOccupiedVolumes={initialSerieOccupiedVolumes}
        initialVolume={initialVolume}
        fromWishlist={fromWishlist}
        initialAuthors={initialAuthors}
        initialTitle={initialTitle}
      />
    </AppShell>
  );
}
