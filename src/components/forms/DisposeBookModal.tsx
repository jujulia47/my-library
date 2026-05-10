"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Button } from "@/components/ui";
import { markBookDisposed } from "@/actions/createQuoteForBook";

export type DisposeBookModalProps = {
  open: boolean;
  onClose: () => void;
  bookId: string;
  bookSlug?: string;
};

export default function DisposeBookModal({
  open,
  onClose,
  bookId,
  bookSlug,
}: DisposeBookModalProps) {
  const router = useRouter();
  const [dateError, setDateError] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setDateError(null);
    setGenericError(null);
    startTransition(async () => {
      const result = await markBookDisposed(fd);
      if (!result.ok) {
        if (result.code === "invalid_dates") {
          setDateError(result.message);
        } else {
          setGenericError(result.message);
        }
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Marcar como vendido/doado"
      size="sm"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <input type="hidden" name="id" value={bookId} />
        {bookSlug && (
          <input type="hidden" name="book_slug" value={bookSlug} />
        )}

        <p className="text-sm text-ink-soft font-body">
          O livro continua na biblioteca, mas será marcado como{" "}
          <span className="italic">doado</span>. Você pode reverter depois.
        </p>

        <Input
          label="Data"
          name="disposed_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          errorText={dateError ?? undefined}
        />

        {genericError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {genericError}
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
          <Button type="submit" variant="primary" size="sm" loading={isPending}>
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
