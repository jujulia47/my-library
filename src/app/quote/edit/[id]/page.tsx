import AppShell from "@/components/AppShell";
import QuoteForm, { type BookOption } from "@/components/forms/QuoteForm";
import { bookList } from "@/services/book";
import { createClient } from "@/utils/supabase/server";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quote")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !quote) {
    return (
      <AppShell>
        <p className="text-ink-soft italic">Citação não encontrada.</p>
      </AppShell>
    );
  }

  const books = (await bookList()) ?? [];
  const bookOptions: BookOption[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author?.trim() ? b.author : null,
  }));

  return (
    <AppShell>
      <QuoteForm
        mode="edit"
        books={bookOptions}
        initial={{
          id: quote.id,
          slug: quote.slug,
          text: quote.text,
          type: quote.book_id ? "linked" : "standalone",
          book_id: quote.book_id,
          page: quote.page,
          chapter: quote.chapter,
          author_name: quote.author_name,
          source: quote.source,
          note: quote.note,
        }}
      />
    </AppShell>
  );
}
