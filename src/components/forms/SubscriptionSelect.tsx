"use client";

import { useState, useTransition } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Select, Button } from "@/components/ui";
import QuickSubscriptionModal, {
  type QuickSubscription,
} from "./QuickSubscriptionModal";
import { updateSubscription } from "@/actions/updateSubscription";
import { formatBRL } from "@/utils/formatCurrency";

export type SubscriptionOption = {
  id: string;
  name: string;
  monthly_price: number | null;
};

type Props = {
  value: string | null;
  onChange: (
    id: string | null,
    name: string | null,
    monthly_price: number | null,
  ) => void;
  /** Lista carregada server-side. Mutações via modal são acumuladas client-side. */
  initialOptions: SubscriptionOption[];
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
};

/**
 * Select single de assinatura com botão "+ Nova" inline. A lista vem do
 * server (similar ao pattern de `allSeries` no BookFull); criar via modal
 * acrescenta ao state local e seleciona automaticamente.
 *
 * O Select renderiza um `<select>` nativo + um hidden field não — passamos o
 * id via `value`/`onChange` e o consumidor (form) controla o submit.
 */
export function SubscriptionSelect({
  value,
  onChange,
  initialOptions,
  label = "Assinatura",
  helperText,
  errorText,
  required,
}: Props) {
  const [options, setOptions] = useState<SubscriptionOption[]>(initialOptions);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = value ? options.find((o) => o.id === value) ?? null : null;

  const handleCreated = (sub: QuickSubscription) => {
    setOptions((prev) =>
      [...prev, sub].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    );
    onChange(sub.id, sub.name, sub.monthly_price);
  };

  const openEditPrice = () => {
    if (!selected) return;
    setEditError(null);
    setEditPriceValue(
      selected.monthly_price !== null ? String(selected.monthly_price) : "",
    );
    setEditingPrice(true);
  };

  const submitEditPrice = () => {
    if (!selected) return;
    setEditError(null);
    const trimmed = editPriceValue.trim();
    const newPrice = trimmed === "" ? null : Number(trimmed);
    if (newPrice !== null && (!Number.isFinite(newPrice) || newPrice < 0)) {
      setEditError("Valor inválido.");
      return;
    }
    startTransition(async () => {
      const result = await updateSubscription(selected.id, {
        monthly_price: newPrice,
      });
      if (!result.ok) {
        setEditError(result.message);
        return;
      }
      // Atualiza a lista local + propaga novo monthly_price pro consumer
      // (que sincroniza o campo `price` do form do livro).
      setOptions((prev) =>
        prev.map((o) =>
          o.id === selected.id
            ? { ...o, monthly_price: result.data?.monthly_price ?? null }
            : o,
        ),
      );
      onChange(
        selected.id,
        selected.name,
        result.data?.monthly_price ?? null,
      );
      setEditingPrice(false);
    });
  };

  return (
    <div className="space-y-2">
      <Select
        label={label}
        name="subscription_id"
        value={value ?? ""}
        onChange={(e) => {
          const id = e.target.value || null;
          const opt = id ? options.find((o) => o.id === id) ?? null : null;
          onChange(id, opt?.name ?? null, opt?.monthly_price ?? null);
          setEditingPrice(false);
        }}
        helperText={helperText}
        errorText={errorText}
        required={required}
      >
        <option value="">— Selecione uma assinatura —</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
            {opt.monthly_price !== null && ` · ${formatBRL(opt.monthly_price)}/mês`}
          </option>
        ))}
      </Select>

      {selected && !editingPrice && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span>Valor mensal:</span>
          {selected.monthly_price !== null ? (
            <span className="font-medium text-ink-deep">
              {formatBRL(selected.monthly_price)}
            </span>
          ) : (
            <span className="italic text-ink-fade">não definido</span>
          )}
          <button
            type="button"
            onClick={openEditPrice}
            className="inline-flex items-center gap-1 text-gold-deep hover:text-ink-deep transition-colors"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            {selected.monthly_price !== null ? "Editar" : "Definir"}
          </button>
        </div>
      )}

      {selected && editingPrice && (
        <div className="rounded-md border border-gold/40 bg-gold/5 p-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-soft">Valor mensal:</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={editPriceValue}
            onChange={(e) => setEditPriceValue(e.target.value)}
            placeholder="R$"
            className="rounded border border-border bg-ivory-light px-2 py-1 text-xs text-ink-deep w-24 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
          />
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={submitEditPrice}
            loading={isPending}
            aria-label="Salvar valor mensal"
          >
            <CheckIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditingPrice(false)}
            aria-label="Cancelar"
          >
            <XMarkIcon className="w-4 h-4" />
          </Button>
          {editError && <p className="w-full text-burgundy">{editError}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-gold-deep hover:text-ink-deep underline transition-colors"
      >
        <PlusIcon className="w-3.5 h-3.5" />
        Nova assinatura
      </button>

      <QuickSubscriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
