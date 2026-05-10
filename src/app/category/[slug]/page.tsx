import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { BackButton, BookCoverFallback } from "@/components/ui";
import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";

type CategoryWithBooks = {
  id: string;
  name: string;
  book_category: Array<{
    book: {
      id: string;
      title: string;
      slug: string;
      cover: string | null;
      book_author: Array<{ author: { name: string } | null }> | null;
    } | null;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Coluna real da capa é `cover` (storage path); URL pública vem via `imagesUrl`.
  const { data } = await supabase
    .from("category")
    .select(
      `id, name, book_category(book(id, title, slug, cover, book_author(author(name))))`,
    )
    .eq("slug", slug)
    .maybeSingle();

  const category = data as unknown as CategoryWithBooks | null;
  if (!category) notFound();

  const books = (category.book_category ?? [])
    .map((bc) => bc.book)
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  return (
    <AppShell>
      <div className="mb-4">
        <BackButton fallback="/category" />
      </div>

      <header className="mb-6 pb-4 border-b border-border">
        <h1 className="font-display text-3xl font-medium text-ink-deep">
          {category.name}
        </h1>
        <p className="text-sm italic text-ink-fade mt-1">
          {books.length} {books.length === 1 ? "livro" : "livros"}
        </p>
      </header>

      {books.length === 0 ? (
        <p className="text-sm italic text-ink-fade text-center py-12">
          Nenhum livro nessa categoria ainda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.map((book) => {
            const authorName = book.book_author?.[0]?.author?.name ?? null;
            const cover = book.cover ? imagesUrl(book.cover) : null;
            return (
              <li key={book.id}>
                <Link
                  href={`/book/${book.slug}`}
                  className="block group"
                  title={book.title}
                >
                  <div
                    className="relative w-full rounded overflow-hidden group-hover:shadow-[0_4px_12px_rgba(74,56,38,0.18)] group-hover:-translate-y-1 transition-all"
                    style={{ aspectRatio: "2 / 3" }}
                  >
                    {cover ? (
                      <Image
                        src={cover}
                        alt={`Capa de ${book.title}`}
                        fill
                        className="object-cover rounded-sm border border-ink-deep/20"
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
                      />
                    ) : (
                      <BookCoverFallback
                        title={book.title}
                        size="md"
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <p
                    className="mt-2 text-xs leading-tight text-ink-deep group-hover:text-gold-deep transition-colors line-clamp-2 font-body"
                  >
                    {book.title}
                  </p>
                  {authorName && (
                    <p className="text-[10px] italic text-ink-fade truncate mt-0.5">
                      {authorName}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
