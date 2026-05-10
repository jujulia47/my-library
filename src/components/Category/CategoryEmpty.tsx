"use client";

import { useState, useTransition } from "react";
import { Button, EmptyState } from "@/components/ui";
import { seedDefaultCategories } from "@/actions/seedDefaultCategories";

export default function CategoryEmpty() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <EmptyState
        title="Você ainda não tem categorias"
        description="Comece com nossa lista padrão ou crie do zero."
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="primary"
              loading={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await seedDefaultCategories();
                  if (!result.ok) setError(result.message);
                });
              }}
            >
              Adicionar categorias padrão
            </Button>
            <Button as="Link" href="/category/new" variant="ghost">
              Criar manualmente
            </Button>
          </div>
        }
      />
      {error && (
        <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
