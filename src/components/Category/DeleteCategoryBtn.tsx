"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui";
import { deleteCategory } from "@/actions/deleteCategory";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function DeleteCategoryBtn({
  id,
  name,
  count,
}: {
  id: string;
  name: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const onConfirm = () => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1.5 rounded text-burgundy hover:bg-burgundy/10 transition-colors"
        aria-label={`Excluir ${name}`}
      >
        <TrashIcon className="w-5 h-5" />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        onConfirm={onConfirm}
        title={`Excluir "${name}"?`}
        description={
          error
            ? error
            : count > 0
              ? `Esta categoria está em ${count} ${count === 1 ? "livro" : "livros"}. As relações serão removidas, mas os livros permanecem. Esta ação não pode ser desfeita.`
              : "Esta ação não pode ser desfeita."
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={isPending}
      />
    </>
  );
}
