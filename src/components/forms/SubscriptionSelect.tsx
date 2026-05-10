"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Select } from "@/components/ui";
import QuickSubscriptionModal, {
  type QuickSubscription,
} from "./QuickSubscriptionModal";

export type SubscriptionOption = { id: string; name: string };

type Props = {
  value: string | null;
  onChange: (id: string | null, name: string | null) => void;
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

  const handleCreated = (sub: QuickSubscription) => {
    setOptions((prev) => [...prev, sub].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
    onChange(sub.id, sub.name);
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
          onChange(id, opt?.name ?? null);
        }}
        helperText={helperText}
        errorText={errorText}
        required={required}
      >
        <option value="">— Selecione uma assinatura —</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </Select>
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
