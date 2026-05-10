import { createClient } from "@/utils/supabase/server";
import type { CurrentReadingItem } from "@/components/CurrentReadingCard";

export async function getCurrentReadings(): Promise<CurrentReadingItem[]> {
  const supabase = await createClient();

  type Row = {
    id: string;
    current_page: number | null;
    start_date: string | null;
    book: {
      id: string;
      title: string;
      slug: string;
      cover: string | null;
      pages: number | null;
      book_author: { author: { name: string } | null }[] | null;
    } | null;
  };

  const { data, error } = await supabase
    .from("reading")
    .select(
      `id, current_page, start_date,
       book:book_id(id, title, slug, cover, pages,
         book_author(author(name))
       )`,
    )
    .eq("status", "reading")
    .order("start_date", { ascending: false, nullsFirst: false });

  if (error || !data) return [];

  return (data as unknown as Row[])
    .map((r): CurrentReadingItem | null => {
      if (!r.book) return null;
      const authors =
        r.book.book_author
          ?.map((ba) => ba.author?.name)
          .filter((n): n is string => !!n) ?? [];
      return {
        reading_id: r.id,
        current_page: r.current_page,
        start_date: r.start_date,
        book: {
          id: r.book.id,
          title: r.book.title,
          slug: r.book.slug,
          cover: r.book.cover,
          pages: r.book.pages,
          authors,
        },
      };
    })
    .filter((x): x is CurrentReadingItem => x !== null);
}
