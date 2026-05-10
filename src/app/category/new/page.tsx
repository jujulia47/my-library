import AppShell from "@/components/AppShell";
import CategoryForm from "@/components/Category/CategoryForm";
import { BackButton } from "@/components/ui";

export default function NewCategoryPage() {
  return (
    <AppShell>
      <div className="max-w-md">
        <div className="mb-4">
          <BackButton fallback="/category" />
        </div>
        <h1 className="font-display text-3xl font-medium text-ink-deep mb-6">
          Nova categoria
        </h1>
        <CategoryForm mode="create" />
      </div>
    </AppShell>
  );
}
