"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Textarea, Button } from "@/components/ui";
import { addBibliographyEntry } from "@/actions/addBibliographyEntry";
import { updateBibliographyEntry } from "@/actions/updateBibliographyEntry";

const NOTES_MAX = 500;

export type BibliographyEntryInitial = {
  id: string;
  title: string;
  publication_year: number | null;
  notes: string | null;
};

export type BibliographyEntryModalProps = {
  open: boolean;
  onClose: () => void;
  authorId: string;
  /** Quando passado, modal vira "edit"; senão é "create". */
  initial?: BibliographyEntryInitial | null;
};

export default function BibliographyEntryModal({
  open,
  onClose,
  authorId,
  initial,
}: BibliographyEntryModalProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [year, setYear] = useState(
    initial?.publication_year !== null && initial?.publication_year !== undefined
      ? String(initial.publication_year)
      : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setYear(
      initial?.publication_year !== null &&
        initial?.publication_year !== undefined
        ? String(initial.publication_year)
        : "",
    );
    setNotes(initial?.notes ?? "");
    setFieldErrors({});
    setGenericError(null);
  }, [open, initial]);

  const submit = () => {
    setFieldErrors({});
    setGenericError(null);
    if (!title.trim()) {
      setFieldErrors({ title: "Título obrigatório." });
      return;
    }
    const yearNum = year.trim() === "" ? null : Number(year);
    startTransition(async () => {
      const result = isEdit
        ? await updateBibliographyEntry({
            id: initial.id,
            title,
            publication_year: yearNum,
            notes: notes || null,
          })
        : await addBibliographyEntry({
            author_id: authorId,
            title,
            publication_year: yearNum,
            notes: notes || null,
          });
      if (!result.ok) {
        if (result.field) setFieldErrors({ [result.field]: result.message });
        else setGenericError(result.message);
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
      title={isEdit ? "Editar obra" : "Adicionar obra"}
      size="sm"
    >
      <div className="space-y-4">
        <Input
          label="Título"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          errorText={fieldErrors.title}
          autoFocus
        />
        <Input
          label="Ano de publicação (opcional)"
          type="number"
          min={1}
          max={9999}
          placeholder="1949"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          errorText={fieldErrors.publication_year}
        />
        <Textarea
          label="Notas (opcional)"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          errorText={fieldErrors.notes}
          maxLength={NOTES_MAX}
          helperText={`${notes.length}/${NOTES_MAX}`}
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
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={submit}
            loading={isPending}
            disabled={!title.trim()}
          >
            {isEdit ? "Salvar" : "Adicionar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
