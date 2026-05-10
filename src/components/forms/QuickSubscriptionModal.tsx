"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import { Input, Textarea, Button } from "@/components/ui";
import { createSubscription } from "@/actions/createSubscription";

export type QuickSubscription = { id: string; name: string };

export type QuickSubscriptionModalProps = {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onCreated: (subscription: QuickSubscription) => void;
};

/**
 * Modal pra criar assinatura inline (similar ao QuickCategoryModal). Usado
 * dentro do form do livro, então não usa <form> aninhado — é um <div> + Input
 * controlado + botão que dispara handler manualmente. Enter no Input também
 * dispara.
 */
export default function QuickSubscriptionModal({
  open,
  onClose,
  initialName = "",
  onCreated,
}: QuickSubscriptionModalProps) {
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Nome obrigatório");
      return;
    }
    setNameError(null);
    setGenericError(null);
    startTransition(async () => {
      const result = await createSubscription({
        name: trimmed,
        notes: notes.trim() || null,
      });
      if (!result.ok) {
        if (result.field === "name") setNameError(result.message);
        else setGenericError(result.message);
        return;
      }
      if (!result.data) {
        setGenericError("Assinatura criada, mas falhou ao recuperar o id.");
        return;
      }
      onCreated(result.data);
      setName("");
      setNotes("");
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova assinatura" size="sm">
      <div className="space-y-5">
        <Input
          label="Nome"
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
          placeholder="Ex.: Vitorianos, TAG, PerSe"
          autoFocus
          errorText={nameError ?? undefined}
        />
        <Textarea
          label="Notas"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional: link da assinatura, valor mensal, etc."
          rows={3}
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
