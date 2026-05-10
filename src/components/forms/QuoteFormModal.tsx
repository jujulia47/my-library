"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Textarea, Button } from "@/components/ui";
import {
  createQuoteForBook,
  updateQuoteText,
} from "@/actions/createQuoteForBook";

export type QuoteFormModalProps = {
  open: boolean;
  onClose: () => void;
  bookId: string;
  bookSlug?: string;
  quote?: {
    id: string;
    text: string;
    page: number | null;
    chapter: string | null;
    author_name: string | null;
    note: string | null;
  } | null;
};

export default function QuoteFormModal({
  open,
  onClose,
  bookId,
  bookSlug,
  quote,
}: QuoteFormModalProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = !!quote;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateQuoteText(fd)
        : await createQuoteForBook(fd);
      if (!result.ok) {
        if (result.field) {
          setFieldErrors({ [result.field]: result.message });
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
      title={isEdit ? "Editar citação" : "Adicionar citação"}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <input type="hidden" name="book_id" value={bookId} />
        {bookSlug && (
          <input type="hidden" name="book_slug" value={bookSlug} />
        )}
        {isEdit && <input type="hidden" name="id" value={quote.id} />}

        <Textarea
          label="Citação"
          name="text"
          required
          defaultValue={quote?.text ?? ""}
          placeholder="O trecho que ficou com você."
          autoFocus
          errorText={fieldErrors.text}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Página"
            name="page"
            type="number"
            defaultValue={quote?.page ?? ""}
            placeholder="Opcional"
          />
          <Input
            label="Capítulo"
            name="chapter"
            defaultValue={quote?.chapter ?? ""}
            placeholder="Opcional"
          />
        </div>

        <Input
          label="Autor da citação"
          name="author_name"
          defaultValue={quote?.author_name ?? ""}
          placeholder="Vazio = usa o autor do livro."
          helperText="Edite se a citação for de outro autor citado dentro do livro."
        />

        <Textarea
          label="Nota pessoal"
          name="note"
          defaultValue={quote?.note ?? ""}
          placeholder="O que essa passagem deixou em você (opcional)."
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
            Salvar citação
          </Button>
        </div>
      </form>
    </Modal>
  );
}
