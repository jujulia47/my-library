import AppShell from "@/components/AppShell";
import BookFull from "@/components/Update/BookFull";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("book")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!book) notFound();

  const [
    { data: bookAuthors },
    { data: bookCategories },
    { data: allCats },
    { data: allSeries },
    { data: subscriptions },
  ] = await Promise.all([
    supabase
      .from("book_author")
      .select("author:author_id(id, name)")
      .eq("book_id", id),
    supabase
      .from("book_category")
      .select("category:category_id(id, name)")
      .eq("book_id", id),
    supabase
      .from("category")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase.from("serie").select("id, name").order("name", { ascending: true }),
    supabase
      .from("subscription")
      .select("id, name")
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  const initialAuthors = (bookAuthors ?? [])
    .map((row) => row.author)
    .filter((a): a is { id: string; name: string } => !!a);
  const initialCategories = (bookCategories ?? [])
    .map((row) => row.category)
    .filter((c): c is { id: string; name: string } => !!c);

  return (
    <AppShell>
      <BookFull
        book={book}
        initialAuthors={initialAuthors}
        initialCategories={initialCategories}
        allCategories={allCats ?? []}
        allSeries={(allSeries ?? []).filter(
          (s): s is { id: string; name: string } => !!s.name,
        )}
        subscriptions={subscriptions ?? []}
      />
    </AppShell>
  );
}
