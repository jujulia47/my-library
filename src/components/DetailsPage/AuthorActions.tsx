"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog } from "@/components/ui";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { deleteAuthor } from "@/actions/deleteAuthor";

export type AuthorActionsProps = {
  authorId: string;
  authorName: string;
  authorSlug: string;
};

export default function AuthorActions({
  authorId,
  authorName,
  authorSlug,
}: AuthorActionsProps) {
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAuthor(authorId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/book");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Button
        as="Link"
        href={`/author/edit/${authorId}?from=/author/${authorSlug}`}
        variant="secondary"
        size="sm"
        leftIcon={<PencilSquareIcon className="w-4 h-4" />}
      >
        Editar
      </Button>
      <div className="relative">
        <button
          type="button"
          aria-label="Mais ações"
          onClick={() => setActionsOpen((o) => !o)}
          onBlur={() => setTimeout(() => setActionsOpen(false), 150)}
          className="p-2 rounded-md border border-border bg-ivory-light text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
        >
          <EllipsisVerticalIcon className="w-5 h-5" />
        </button>
        {actionsOpen && (
          <div className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-ivory-light shadow-lg z-20">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setActionsOpen(false);
                setConfirmOpen(true);
              }}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-burgundy hover:bg-burgundy/10 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Excluir autor
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setError(null);
        }}
        onConfirm={handleDelete}
        title="Excluir autor?"
        description={
          error
            ? error
            : `"${authorName}" será removido. Os vínculos com livros (book_author) e a bibliografia também serão removidos. Os livros em si não são afetados.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={isPending}
      />
    </div>
  );
}
