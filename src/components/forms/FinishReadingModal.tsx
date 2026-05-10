"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Textarea, Button } from "@/components/ui";
import StarRating from "@/components/FormFields/StarRating";
import { finishReading } from "@/actions/finishReading";

export type FinishReadingModalProps = {
  open: boolean;
  onClose: () => void;
  readingId: string;
  bookSlug?: string;
};

export default function FinishReadingModal({
  open,
  onClose,
  readingId,
  bookSlug,
}: FinishReadingModalProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(0);
  const [dateError, setDateError] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setDateError(null);
    setGenericError(null);
    startTransition(async () => {
      const result = await finishReading(fd);
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
    <Modal open={open} onClose={onClose} title="Marcar como lida" size="md">
      <form onSubmit={onSubmit} className="space-y-5">
        <input type="hidden" name="id" value={readingId} />
        {bookSlug && <input type="hidden" name="book_slug" value={bookSlug} />}

        <Input
          label="Data de fim"
          name="finish_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          errorText={dateError ?? undefined}
        />

        <StarRating
          label="Avaliação"
          value={rating}
          onChange={setRating}
          name="rating"
        />

        <Textarea
          label="Resenha"
          name="review"
          placeholder="O que ficou pra você?"
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
            Concluir
          </Button>
        </div>
      </form>
    </Modal>
  );
}
