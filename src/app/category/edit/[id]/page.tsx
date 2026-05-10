import AppShell from "@/components/AppShell";
import CategoryForm from "@/components/Category/CategoryForm";
import { BackButton } from "@/components/ui";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("category")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!category) notFound();

  return (
    <AppShell>
      <div className="max-w-md">
        <div className="mb-4">
          <BackButton fallback="/category" />
        </div>
        <h1 className="font-display text-3xl font-medium text-ink-deep mb-6">
          Editar categoria
        </h1>
        <CategoryForm
          mode="edit"
          initial={{ id: category.id, name: category.name }}
        />
      </div>
    </AppShell>
  );
}
