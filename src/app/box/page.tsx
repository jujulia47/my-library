import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";
import { CubeIcon } from "@heroicons/react/24/outline";
import BoxList from "@/components/Read/Box/BoxList";
import type { BoxRow } from "@/components/Read/Box/BoxList";

export const dynamic = "force-dynamic";

export default async function BoxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Boxes / kits" />
      </AppShell>
    );
  }

  const { data: groups } = await supabase
    .from("purchase_group")
    .select("id, name, total_price, acquired_at, notes")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Contagem de livros por grupo. Single round-trip pegando todos os livros
  // vinculados de uma vez.
  const { data: linkedBooks } = await supabase
    .from("book")
    .select("id, slug, title, purchase_group_id")
    .eq("user_id", user.id)
    .not("purchase_group_id", "is", null);

  const booksByGroup = new Map<
    string,
    { id: string; slug: string; title: string }[]
  >();
  for (const b of linkedBooks ?? []) {
    if (!b.purchase_group_id) continue;
    const list = booksByGroup.get(b.purchase_group_id) ?? [];
    list.push({ id: b.id, slug: b.slug, title: b.title });
    booksByGroup.set(b.purchase_group_id, list);
  }

  const rows: BoxRow[] = (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    total_price: Number(g.total_price),
    acquired_at: g.acquired_at ?? null,
    notes: g.notes ?? null,
    books: booksByGroup.get(g.id) ?? [],
  }));

  return (
    <AppShell>
      <PageHeader
        title="Boxes / kits"
        subtitle={
          rows.length === 0
            ? "Aquisições em grupo aparecem aqui"
            : `${rows.length} ${rows.length === 1 ? "box" : "boxes"} cadastrado${rows.length === 1 ? "" : "s"}`
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<CubeIcon className="w-12 h-12" />}
          title="Nenhum box cadastrado"
          description="Quando você marca a origem de aquisição de um livro como 'compra' e vincula a um box, ele aparece aqui pra você gerenciar nome, valor total e data."
        />
      ) : (
        <BoxList initialRows={rows} />
      )}
    </AppShell>
  );
}
