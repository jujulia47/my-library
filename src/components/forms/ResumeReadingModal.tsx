"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Button } from "@/components/ui";
import { resumeReading } from "@/actions/resumeReading";

export type ResumeReadingModalProps = {
  open: boolean;
  onClose: () => void;
  readingId: string;
  bookSlug?: string;
};

export default function ResumeReadingModal({
  open,
  onClose,
  readingId,
  bookSlug,
}: ResumeReadingModalProps) {
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
      const result = await resumeReading(fd);
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
    <Modal open={open} onClose={onClose} title="Retomar leitura" size="sm">
      <form onSubmit={onSubmit} className="space-y-5">
        <input type="hidden" name="id" value={readingId} />
        {bookSlug && <input type="hidden" name="book_slug" value={bookSlug} />}

        <Input
          label="Data em que retomou"
          name="resumed_date"
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
            Retomar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
