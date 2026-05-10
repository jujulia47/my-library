import AppShell from "@/components/AppShell";
import QuoteForm, { type BookOption } from "@/components/forms/QuoteForm";
import { bookList } from "@/services/book";
import { createClient } from "@/utils/supabase/server";

export default async function CreateQuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const authorIdRaw = Array.isArray(sp.author_id)
    ? sp.author_id[0]
    : sp.author_id;

  const books = (await bookList()) ?? [];
  const bookOptions: BookOption[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author?.trim() ? b.author : null,
  }));

  // Pré-fill de autor vindo da toolbar do detail page do autor (?author_id=)
  let initialAuthorName: string | undefined;
  if (authorIdRaw) {
    const supabase = await createClient();
    const { data: authorRow } = await supabase
      .from("author")
      .select("name")
      .eq("id", authorIdRaw)
      .maybeSingle();
    if (authorRow) initialAuthorName = authorRow.name;
  }

  return (
    <AppShell>
      <QuoteForm
        mode="create"
        books={bookOptions}
        initialAuthorName={initialAuthorName}
      />
    </AppShell>
  );
}
