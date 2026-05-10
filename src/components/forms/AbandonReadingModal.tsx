"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Textarea, Button } from "@/components/ui";
import { abandonReading } from "@/actions/abandonReading";

export type AbandonReadingModalProps = {
  open: boolean;
  onClose: () => void;
  readingId: string;
  bookSlug?: string;
};

export default function AbandonReadingModal({
  open,
  onClose,
  readingId,
  bookSlug,
}: AbandonReadingModalProps) {
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
      const result = await abandonReading(fd);
      if (!result.ok) {
        if (result.field === "event_date") {
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
    <Modal open={open} onClose={onClose} title="Abandonar leitura" size="md">
      <form onSubmit={onSubmit} className="space-y-5">
        <input type="hidden" name="id" value={readingId} />
        {bookSlug && <input type="hidden" name="book_slug" value={bookSlug} />}

        <Input
          label="Data"
          name="finish_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          errorText={dateError ?? undefined}
        />

        <Textarea
          label="Por que abandonei? (opcional)"
          name="review"
          placeholder="Não precisa explicar — mas se quiser deixar uma nota pra você mesma…"
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
            Abandonar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
