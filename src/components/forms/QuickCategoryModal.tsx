"use client";

import { useRef, useState, useTransition } from "react";
import Modal from "./Modal";
import { Input, Button } from "@/components/ui";
import { createCategory } from "@/actions/createCategory";

export type QuickCategory = { id: string; name: string };

export type QuickCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  initialName: string;
  onCreated: (category: QuickCategory) => void;
};

/**
 * Modal usado de dentro do CategoryMultiSelect, que por sua vez vive dentro
 * do <form> do BookFull/BookMinimal. HTML não permite <form> aninhado — por
 * isso aqui o "form" é só um <div> com um Input controlado e um botão que
 * dispara o handler manualmente. Enter no Input também dispara.
 */
export default function QuickCategoryModal({
  open,
  onClose,
  initialName,
  onCreated,
}: QuickCategoryModalProps) {
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const lastInitialName = useRef(initialName);

  // Re-popula o input se o modal for reaberto com um nome diferente.
  if (lastInitialName.current !== initialName) {
    lastInitialName.current = initialName;
    setName(initialName);
  }

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Nome obrigatório");
      return;
    }
    setNameError(null);
    setGenericError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", trimmed);
      const result = await createCategory(fd);
      if (!result.ok) {
        if (result.field === "name") {
          setNameError(result.message);
        } else {
          setGenericError(result.message);
        }
        return;
      }
      const lookup = await fetch(
        `/api/categories/lookup?name=${encodeURIComponent(trimmed)}`,
      );
      if (!lookup.ok) {
        setGenericError("Categoria criada, mas falhou ao buscar id.");
        return;
      }
      const { category } = (await lookup.json()) as {
        category: QuickCategory | null;
      };
      if (!category) {
        setGenericError("Categoria criada, mas não foi encontrada.");
        return;
      }
      onCreated(category);
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova categoria" size="sm">
      <div className="space-y-5">
        <Input
          label="Nome da categoria"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ex.: Steampunk"
          autoFocus
          errorText={nameError ?? undefined}
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
            loading={isPending}
            onClick={submit}
          >
            Criar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
