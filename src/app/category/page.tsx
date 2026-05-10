import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import {
  PageHeader,
  Button,
  EmptyState,
  Card,
} from "@/components/ui";
import Link from "next/link";
import CategoryEmpty from "@/components/Category/CategoryEmpty";
import DeleteCategoryBtn from "@/components/Category/DeleteCategoryBtn";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export default async function CategoryPage() {
  const supabase = await createClient();

  // Conta livros por categoria via book_category.
  const { data: categories } = await supabase
    .from("category")
    .select("id, name, slug, book_category(count)")
    .order("name", { ascending: true });

  const list = (categories ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    book_category: { count: number }[];
  }>;

  return (
    <AppShell>
      <PageHeader
        title="Categorias"
        subtitle="Gêneros e tags para organizar seus livros"
        actions={
          list.length > 0 ? (
            <Button as="Link" href="/category/new" variant="primary" size="sm">
              Nova categoria
            </Button>
          ) : null
        }
      />

      {list.length === 0 ? (
        <CategoryEmpty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => {
            const count = c.book_category?.[0]?.count ?? 0;
            return (
              <Card key={c.id} size="sm" className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-medium text-ink-deep truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-ink-fade italic">
                    {count} {count === 1 ? "livro" : "livros"}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/category/edit/${c.id}`}
                    className="p-1.5 rounded text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
                    aria-label={`Editar ${c.name}`}
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </Link>
                  <DeleteCategoryBtn id={c.id} name={c.name} count={count} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
