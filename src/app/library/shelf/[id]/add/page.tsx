import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";
import { getShelfById } from "@/services/libraryData";
import { ShelfSymbol } from "@/components/Library/ShelfSymbol";
import {
  BookPickerForShelf,
  type OrphanBook,
} from "@/components/Library/BookPickerForShelf";

export const metadata: Metadata = {
  title: "Adicionar à estante · my-library",
};

type Props = {
  params: Promise<{ id: string }>;
};

type OrphanRaw = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  book_author: { author: { name: string } | null }[] | null;
};

export default async function AddBookToShelfPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const shelf = await getShelfById(id, user.id);
  if (!shelf) notFound();

  // Livros físicos `em_casa`/`emprestado` sem estante (órfãos).
  const { data: rows } = await supabase
    .from("book")
    .select(
      `id, slug, title, cover,
       book_author(author(name))`,
    )
    .eq("user_id", user.id)
    .in("ownership_status", ["owned", "lent_out"])
    .contains("formats_owned", ["physical"])
    .is("shelf_id", null)
    .order("title", { ascending: true });

  const orphans: OrphanBook[] = ((rows as unknown as OrphanRaw[] | null) ?? [])
    .map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      author_name:
        b.book_author?.find((ba) => ba.author?.name)?.author?.name ?? null,
      cover_url: b.cover ? imagesUrl(b.cover) : null,
    }));

  return (
    <main className="min-h-screen bg-library-dark px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link
            href={`/library/shelf/${id}`}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gold/30 hover:border-roasted-chestnut rounded transition-colors"
            style={{ color: "rgba(245, 232, 208, 0.85)" }}
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
            Voltar pra estante
          </Link>
          <h1
            className="font-display text-lg flex items-center gap-2"
            style={{ color: "var(--color-paper-aged)" }}
          >
            <ShelfSymbol symbol={shelf.symbol} size={20} />
            Catalogar livro
          </h1>
        </div>

        <p
          className="text-sm italic mb-6"
          style={{ color: "rgba(245, 232, 208, 0.65)" }}
        >
          Livros físicos sem estante (em casa ou emprestados).
        </p>

        <BookPickerForShelf orphans={orphans} shelfId={id} />
      </div>
    </main>
  );
}
