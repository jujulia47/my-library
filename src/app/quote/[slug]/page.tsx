import AppShell from "@/components/AppShell";
import QuoteDetailClient, {
  type QuoteDetail,
} from "@/components/DetailsPage/QuoteDetailClient";
import { createClient } from "@/utils/supabase/server";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quote")
    .select(`*, book(id, slug, title, book_author(author(name)))`)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !quote) {
    return (
      <AppShell>
        <p className="text-ink-soft italic">Citação não encontrada.</p>
      </AppShell>
    );
  }

  let book: QuoteDetail["book"] = null;
  const rawBook = (quote as { book?: { id: string; slug: string; title: string; book_author?: { author: { name: string } | null }[] | null } | null }).book;
  if (rawBook) {
    const authors =
      rawBook.book_author
        ?.map((ba) => ba.author?.name)
        .filter((n): n is string => !!n) ?? [];
    book = {
      id: rawBook.id,
      slug: rawBook.slug,
      title: rawBook.title,
      author: authors.length ? authors.join(", ") : null,
    };
  }

  const detail: QuoteDetail = {
    id: quote.id,
    slug: quote.slug,
    text: quote.text,
    page: quote.page,
    chapter: quote.chapter,
    author_name: quote.author_name,
    source: quote.source,
    note: quote.note,
    is_favorite: quote.is_favorite,
    book,
  };

  return (
    <AppShell>
      <QuoteDetailClient quote={detail} />
    </AppShell>
  );
}
