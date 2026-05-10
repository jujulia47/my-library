"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Textarea, Select, Button } from "@/components/ui";
import StarRating from "@/components/FormFields/StarRating";
import { createReading } from "@/actions/createReading";
import { updateReading } from "@/actions/updateReading";
import type { Database } from "@/utils/typings/supabase";

type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type BookFormat = Database["public"]["Enums"]["book_format"];

/**
 * `tbr` é pseudo-status (não existe no enum do banco). No modo "criar"
 * aparece como opção no radio, mas selecioná-lo significa "não registrar
 * leitura" — submit fecha o modal sem chamar action. No modo "editar" o
 * radio NÃO inclui tbr, porque uma reading existente não pode "voltar a ser
 * inexistente" (pra isso o usuário deleta a reading).
 */
type RadioStatus = ReadingStatus | "tbr";

const CREATE_STATUSES: { value: RadioStatus; label: string }[] = [
  { value: "tbr", label: "Quero ler" },
  { value: "reading", label: "Lendo" },
  { value: "paused", label: "Pausada" },
  { value: "finished", label: "Lida" },
  { value: "abandoned", label: "Abandonada" },
];

const EDIT_STATUSES: { value: ReadingStatus; label: string }[] = [
  { value: "reading", label: "Lendo" },
  { value: "paused", label: "Pausada" },
  { value: "finished", label: "Lida" },
  { value: "abandoned", label: "Abandonada" },
];

const formatOptions = [
  { value: "physical", label: "Físico" },
  { value: "ebook", label: "E-book" },
  { value: "audiobook", label: "Audiobook" },
];

/**
 * Visibilidade de campos por status (matriz da spec). `format` aparece
 * sempre — é metadado do livro/leitura independente de progresso.
 */
function visibleFields(status: RadioStatus) {
  return {
    format: true,
    start_date: status !== "tbr",
    finish_date: status === "finished" || status === "abandoned",
    current_page: status === "reading" || status === "paused",
    rating: status === "finished" || status === "abandoned",
    review: status === "finished" || status === "abandoned",
  };
}

export type ReadingFormModalProps = {
  open: boolean;
  onClose: () => void;
  bookId: string;
  bookSlug?: string;
  reading?: {
    id: string;
    status: ReadingStatus;
    format: BookFormat | null;
    start_date: string | null;
    finish_date: string | null;
    current_page: number | null;
    rating: number | null;
    review: string | null;
  } | null;
};

export default function ReadingFormModal({
  open,
  onClose,
  bookId,
  bookSlug,
  reading,
}: ReadingFormModalProps) {
  const router = useRouter();
  const isEdit = !!reading;
  const [status, setStatus] = useState<RadioStatus>(
    reading?.status ?? "reading",
  );
  const [rating, setRating] = useState<number>(reading?.rating ?? 0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Quando o modal reabre com uma reading diferente (ou troca create<->edit),
  // re-sincroniza state local. `reading?.id` muda → sinal de identidade.
  useEffect(() => {
    if (!open) return;
    setStatus(reading?.status ?? "reading");
    setRating(reading?.rating ?? 0);
    setFieldErrors({});
    setGenericError(null);
  }, [open, reading?.id, reading?.status, reading?.rating]);

  const fields = visibleFields(status);
  const isTbrInCreate = !isEdit && status === "tbr";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TBR no modo criar: nada vai pro banco; só fecha. Mantém o `useTransition`
    // de fora pra UI seguir consistente (botão não fica em loading falso).
    if (isTbrInCreate) {
      onClose();
      return;
    }

    const fd = new FormData(e.currentTarget);
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      const result = isEdit ? await updateReading(fd) : await createReading(fd);
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

  const radioOptions: { value: RadioStatus; label: string }[] = isEdit
    ? EDIT_STATUSES
    : CREATE_STATUSES;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar leitura" : "Registrar leitura"}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <input type="hidden" name="book_id" value={bookId} />
        {bookSlug && (
          <input type="hidden" name="book_slug" value={bookSlug} />
        )}
        {isEdit && <input type="hidden" name="id" value={reading.id} />}

        <fieldset className="space-y-2">
          <legend className="text-sm font-body font-medium text-ink-deep mb-2">
            Status
          </legend>
          <div className="flex flex-wrap gap-2">
            {radioOptions.map((s) => {
              const checked = status === s.value;
              return (
                <label
                  key={s.value}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    checked
                      ? "bg-moss text-ivory-light border-moss"
                      : "bg-ivory-light text-ink-deep border-border hover:bg-paper-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s.value}
                    checked={checked}
                    onChange={() => setStatus(s.value)}
                    className="sr-only"
                  />
                  {s.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {isTbrInCreate && (
          <p className="text-xs italic text-ink-fade leading-relaxed">
            &ldquo;Quero ler&rdquo; é o estado padrão de um livro sem leituras
            registradas — não precisa criar uma leitura. Mude o status pra
            registrar progresso, ou feche o modal.
          </p>
        )}

        {fields.format && (
          <Select
            label="Formato"
            name="format"
            options={formatOptions}
            defaultValue={reading?.format ?? ""}
            placeholder="Não informado"
          />
        )}

        {(fields.start_date || fields.finish_date) && (
          <div className="grid grid-cols-2 gap-3">
            {fields.start_date && (
              <Input
                label="Início"
                name="start_date"
                type="date"
                defaultValue={reading?.start_date ?? ""}
                errorText={fieldErrors.start_date}
              />
            )}
            {fields.finish_date && (
              <Input
                label="Fim"
                name="finish_date"
                type="date"
                defaultValue={reading?.finish_date ?? ""}
                errorText={fieldErrors.finish_date}
              />
            )}
          </div>
        )}

        {fields.current_page && (
          <Input
            label="Página atual"
            name="current_page"
            type="number"
            defaultValue={reading?.current_page ?? ""}
          />
        )}

        {fields.rating && (
          <div>
            <StarRating
              label="Avaliação"
              value={rating}
              onChange={setRating}
              name="rating"
            />
          </div>
        )}

        {fields.review && (
          <Textarea
            label="Resenha"
            name="review"
            defaultValue={reading?.review ?? ""}
            placeholder="O que ficou pra você?"
          />
        )}

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
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
            disabled={isTbrInCreate}
          >
            Salvar leitura
          </Button>
        </div>
      </form>
    </Modal>
  );
}
