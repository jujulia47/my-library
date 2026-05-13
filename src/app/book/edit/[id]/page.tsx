import AppShell from "@/components/AppShell";
import BookFull from "@/components/Update/BookFull";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default async function EditBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const fromWishlistMatch = sp.from_wishlist_match === "1";
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("book")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!book) notFound();

  const bundledIds = (book.bundled_with ?? []) as string[];

  const [
    { data: bookAuthors },
    { data: bookCategories },
    { data: allCats },
    { data: allSeries },
    { data: subscriptions },
    { data: bundledBooksRaw },
    { data: groupRaw },
    { data: groupBookCountRaw },
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
      .select("id, name, monthly_price")
      .eq("active", true)
      .order("name", { ascending: true }),
    bundledIds.length > 0
      ? supabase
          .from("book")
          .select("id, title, slug")
          .in("id", bundledIds)
      : Promise.resolve({ data: [] }),
    book.purchase_group_id
      ? supabase
          .from("purchase_group")
          .select("id, name, total_price, acquired_at, isbn")
          .eq("id", book.purchase_group_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    book.purchase_group_id
      ? supabase
          .from("book")
          .select("id")
          .eq("purchase_group_id", book.purchase_group_id)
      : Promise.resolve({ data: [] }),
  ]);

  const initialAuthors = (bookAuthors ?? [])
    .map((row) => row.author)
    .filter((a): a is { id: string; name: string } => !!a);
  const initialCategories = (bookCategories ?? [])
    .map((row) => row.category)
    .filter((c): c is { id: string; name: string } => !!c);
  const initialBundled = (bundledBooksRaw ?? []) as {
    id: string;
    title: string;
    slug: string;
  }[];

  const groupRow = groupRaw as {
    id: string;
    name: string;
    total_price: number;
    acquired_at: string | null;
    isbn: string | null;
  } | null;
  const groupBookCount = (groupBookCountRaw ?? []).length;
  const initialPurchaseGroup = groupRow
    ? {
        id: groupRow.id,
        name: groupRow.name,
        total_price: Number(groupRow.total_price),
        acquired_at: groupRow.acquired_at,
        isbn: groupRow.isbn,
        book_count: groupBookCount,
      }
    : null;

  return (
    <AppShell>
      {fromWishlistMatch && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-moss/40 bg-moss/10 px-3 py-2.5 text-sm text-ink-deep max-w-4xl">
          <CheckCircleIcon
            className="w-5 h-5 flex-shrink-0 text-moss mt-0.5"
            aria-hidden
          />
          <p>
            Esse livro já estava cadastrado. Movemos o item da wishlist pra cá
            — atualize abaixo os campos de <strong>posse</strong> (estado,
            origem, data de aquisição) e salve.
          </p>
        </div>
      )}
      <BookFull
        book={book}
        initialAuthors={initialAuthors}
        initialCategories={initialCategories}
        initialBundled={initialBundled}
        initialPurchaseGroup={initialPurchaseGroup}
        allCategories={allCats ?? []}
        allSeries={(allSeries ?? []).filter(
          (s): s is { id: string; name: string } => !!s.name,
        )}
        subscriptions={(subscriptions ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          monthly_price:
            s.monthly_price !== null ? Number(s.monthly_price) : null,
        }))}
      />
    </AppShell>
  );
}
