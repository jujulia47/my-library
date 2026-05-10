"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Button } from "@/components/ui";
import { updateReadingProgress } from "@/actions/updateReadingProgress";

export type UpdateProgressTarget = {
  reading_id: string;
  book_slug: string;
  book_title: string;
  current_page: number;
  pages_count: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  target: UpdateProgressTarget | null;
};

export default function UpdateProgressModal({ open, onClose, target }: Props) {
  const router = useRouter();
  const [page, setPage] = useState<string>(
    target ? String(target.current_page) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setPage(target ? String(target.current_page) : "");
    setError(null);
    setFieldError(null);
  }, [open, target?.reading_id, target?.current_page, target]);

  if (!target) return null;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setFieldError(null);
    startTransition(async () => {
      const result = await updateReadingProgress(fd);
      if (!result.ok) {
        if (result.field === "current_page") {
          setFieldError(result.message);
        } else {
          setError(result.message);
        }
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const total = target.pages_count;
  const numericPage = Number(page);
  const validPercent =
    total > 0 && Number.isFinite(numericPage)
      ? Math.min(100, Math.max(0, Math.round((numericPage / total) * 100)))
      : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Atualizar progresso · ${target.book_title}`}
      size="sm"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="id" value={target.reading_id} />
        <input type="hidden" name="book_slug" value={target.book_slug} />

        <Input
          label="Página atual"
          name="current_page"
          type="number"
          min={0}
          max={total > 0 ? total : undefined}
          value={page}
          onChange={(e) => setPage(e.target.value)}
          helperText={
            total > 0
              ? `de ${total} páginas · ${validPercent}%`
              : "número da página atual"
          }
          errorText={fieldError ?? undefined}
          autoFocus
        />

        {error && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
          >
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
