"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Button } from "@/components/ui";
import { renameSection } from "@/actions/renameSection";
import { deleteSection } from "@/actions/deleteSection";

export type SectionEditModalProps = {
  open: boolean;
  onClose: () => void;
  collectionId: string;
  /** null representa "Sem seção" — só renomear é permitido (cria seção nova). */
  sectionName: string | null;
  itemCount: number;
};

export default function SectionEditModal({
  open,
  onClose,
  collectionId,
  sectionName,
  itemCount,
}: SectionEditModalProps) {
  const router = useRouter();
  const [name, setName] = useState(sectionName ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName(sectionName ?? "");
    setFieldErrors({});
    setGenericError(null);
    setConfirmingDelete(false);
  }, [open, sectionName]);

  const submitRename = () => {
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      const result = await renameSection({
        collection_id: collectionId,
        old_name: sectionName,
        new_name: name,
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

  const submitDelete = () => {
    if (!sectionName) return;
    setGenericError(null);
    startTransition(async () => {
      const result = await deleteSection({
        collection_id: collectionId,
        section_name: sectionName,
      });
      if (!result.ok) {
        setGenericError(result.message);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const isUnsectioned = sectionName === null;
  const title = isUnsectioned
    ? "Criar uma seção a partir de 'Sem seção'"
    : "Editar seção";

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {!isUnsectioned && (
          <p className="text-sm text-ink-soft">
            Renomear afeta os {itemCount}{" "}
            {itemCount === 1 ? "item" : "items"} desta seção. Excluir mantém
            os items na coleção, sem seção.
          </p>
        )}
        {isUnsectioned && (
          <p className="text-sm text-ink-soft">
            Os {itemCount} {itemCount === 1 ? "item sem seção" : "items sem seção"}{" "}
            ganharão essa nova seção.
          </p>
        )}
        <Input
          label="Nome da seção"
          value={name}
          onChange={(e) => setName(e.target.value)}
          errorText={fieldErrors.new_name}
          autoFocus
          required
        />
        {genericError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {genericError}
          </p>
        )}
        {confirmingDelete ? (
          <div className="flex flex-col gap-2 p-3 rounded-md bg-burgundy/10 border border-burgundy/30">
            <p className="text-sm text-burgundy">
              Tem certeza? Os items vão pra &quot;Sem seção&quot;.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
                disabled={isPending}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={submitDelete}
                loading={isPending}
              >
                Confirmar exclusão
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center pt-3 border-t border-border">
            {!isUnsectioned ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-sm text-burgundy hover:underline"
                disabled={isPending}
              >
                Excluir seção
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
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
                onClick={submitRename}
                loading={isPending}
                disabled={!name.trim()}
              >
                {isUnsectioned ? "Criar seção" : "Renomear"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
