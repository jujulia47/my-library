"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import { Input, Textarea, Button } from "@/components/ui";
import { createSubscription } from "@/actions/createSubscription";

export type QuickSubscription = {
  id: string;
  name: string;
  monthly_price: number | null;
};

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
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Nome obrigatório");
      return;
    }
    setNameError(null);
    setPriceError(null);
    setGenericError(null);

    let priceValue: number | null = null;
    if (monthlyPrice.trim() !== "") {
      const n = Number(monthlyPrice);
      if (!Number.isFinite(n) || n < 0) {
        setPriceError("Valor inválido.");
        return;
      }
      priceValue = n;
    }

    startTransition(async () => {
      const result = await createSubscription({
        name: trimmed,
        notes: notes.trim() || null,
        monthly_price: priceValue,
      });
      if (!result.ok) {
        if (result.field === "name") setNameError(result.message);
        else if (result.field === "monthly_price") setPriceError(result.message);
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
      setMonthlyPrice("");
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
        <Input
          label="Valor mensal (R$, opcional)"
          name="monthly_price"
          type="number"
          step="0.01"
          min="0"
          value={monthlyPrice}
          onChange={(e) => setMonthlyPrice(e.target.value)}
          placeholder="Ex.: 89.90"
          helperText="Preenche automaticamente o preço dos livros vinculados a essa assinatura."
          errorText={priceError ?? undefined}
        />
        <Textarea
          label="Notas"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional: link, observações, etc."
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
