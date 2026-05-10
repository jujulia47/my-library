"use client";

import { useState } from "react";
import { Select, Input } from "@/components/ui";
import {
  OWNERSHIP_STATUS_OPTIONS,
  PURCHASE_ORIGIN_OPTIONS,
  STATUSES_WITH_PURCHASE_ORIGIN,
  STATUSES_WITH_BORROWED_FROM,
  STATUSES_WITH_LENT_TO,
  STATUSES_WITH_ACQUIRED_AT,
  STATUSES_WITH_BORROWED_AT,
  eventDateForStatus,
  eventDateForTransition,
} from "@/utils/labels";
import {
  SubscriptionSelect,
  type SubscriptionOption,
} from "./SubscriptionSelect";
import type { Database } from "@/utils/typings/supabase";

type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type PurchaseOrigin = Database["public"]["Enums"]["purchase_origin"];

export type OwnershipInitialValues = {
  ownership_status: OwnershipStatus;
  purchase_origin: PurchaseOrigin | null;
  purchase_price: number | null;
  acquired_at: string | null;
  lent_out_at: string | null;
  borrowed_at: string | null;
  returned_at: string | null;
  returned_to_acervo_at: string | null;
  disposed_date: string | null;
  borrowed_from: string | null;
  lent_to: string | null;
  subscription_id: string | null;
};

export type OwnershipFieldsProps = {
  initial: OwnershipInitialValues;
  /** Lista de assinaturas pra popular o SubscriptionSelect (do server). */
  subscriptions: SubscriptionOption[];
  /** Erros do form, indexados pelo `name` do campo. */
  fieldErrors?: Record<string, string>;
};

/**
 * Converte `timestamptz`/`date` ISO do banco pra `YYYY-MM-DD` consumível por
 * `<input type="date">`. Aceita string vazia/null como vazio.
 */
function toDateInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

const TERMINAL_STATES: OwnershipStatus[] = [
  "donated",
  "sold",
  "traded",
  "lost",
];

/**
 * Form section "Posse" — estado físico + origem + datas de evento (sessão
 * 17.2.6). Estado atual é comparado ao estado inicial (persistido) pra
 * detectar transições especiais como `lent_out → owned` (volta pro acervo),
 * que mostra um campo extra `returned_to_acervo_at`.
 *
 * Cada estado tem seu(s) campo(s) de data dedicado(s), com label dinâmico
 * via `eventDateForStatus`. A action consome esses campos pra:
 *   1. atualizar `book.{event_field}` apropriado;
 *   2. inserir entry em `book_status_history` com `changed_at = data do evento`.
 *
 * Persistência: campos invisíveis ficam no state local (recovery se user
 * volta pro estado), mas a action só persiste os relevantes.
 */
export function OwnershipFields({
  initial,
  subscriptions,
  fieldErrors = {},
}: OwnershipFieldsProps) {
  // `previousStatus` é o estado persistido (não muda durante edição).
  const previousStatus = initial.ownership_status;

  const [status, setStatus] = useState<OwnershipStatus>(previousStatus);
  const [origin, setOrigin] = useState<PurchaseOrigin | "">(
    initial.purchase_origin ?? "",
  );
  const [price, setPrice] = useState<string>(
    initial.purchase_price !== null ? String(initial.purchase_price) : "",
  );

  // Datas — todas em YYYY-MM-DD. Inputs do tipo date só aceitam esse formato.
  const [acquiredAt, setAcquiredAt] = useState(toDateInput(initial.acquired_at));
  const [lentOutAt, setLentOutAt] = useState(toDateInput(initial.lent_out_at));
  const [borrowedAt, setBorrowedAt] = useState(toDateInput(initial.borrowed_at));
  const [returnedAt, setReturnedAt] = useState(toDateInput(initial.returned_at));
  const [returnedToAcervoAt, setReturnedToAcervoAt] = useState(
    toDateInput(initial.returned_to_acervo_at),
  );
  const [disposedDate, setDisposedDate] = useState(
    toDateInput(initial.disposed_date),
  );

  const [borrowedFrom, setBorrowedFrom] = useState<string>(
    initial.borrowed_from ?? "",
  );
  const [lentTo, setLentTo] = useState<string>(initial.lent_to ?? "");
  const [subscriptionId, setSubscriptionId] = useState<string | null>(
    initial.subscription_id,
  );

  // === Visibilidade derivada do estado atual ===
  const showOrigin = STATUSES_WITH_PURCHASE_ORIGIN.includes(status);
  const showBorrowedFrom = STATUSES_WITH_BORROWED_FROM.includes(status);
  const showLentTo = STATUSES_WITH_LENT_TO.includes(status);
  const showSubscription = showOrigin && origin === "assinatura";
  const showPriceRequired = showOrigin && origin === "compra";
  const showPriceOptional = showOrigin && origin === "assinatura";
  const showPrice = showPriceRequired || showPriceOptional;

  const showAcquiredAt = STATUSES_WITH_ACQUIRED_AT.includes(status);
  const showLentOutAt = status === "lent_out";
  const showBorrowedAt = STATUSES_WITH_BORROWED_AT.includes(status);
  const showReturnedAt = status === "returned";
  const showDisposedDate = TERMINAL_STATES.includes(status);

  // Transição especial: lent_out → owned ("voltou pro acervo").
  const transition = eventDateForTransition(previousStatus, status);
  const showReturnedToAcervoAt = transition !== null;

  // Label do `disposed_date` muda por estado — pega via helper.
  const disposedConfig = showDisposedDate ? eventDateForStatus(status) : null;

  return (
    <div className="space-y-5">
      <Select
        label="Estado físico"
        name="ownership_status"
        value={status}
        onChange={(e) => setStatus(e.target.value as OwnershipStatus)}
        helperText="Onde está esse livro hoje? (Define o que aparece nos próximos campos.)"
      >
        {OWNERSHIP_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      {showBorrowedFrom && (
        <Input
          label={
            status === "borrowed"
              ? "De quem peguei emprestado"
              : "Era emprestado de quem"
          }
          name="borrowed_from"
          required={status === "borrowed"}
          value={borrowedFrom}
          onChange={(e) => setBorrowedFrom(e.target.value)}
          placeholder="Ex.: Maria, Biblioteca Mário de Andrade"
          errorText={fieldErrors.borrowed_from}
        />
      )}

      {showLentTo && (
        <Input
          label="Pra quem emprestei"
          name="lent_to"
          value={lentTo}
          onChange={(e) => setLentTo(e.target.value)}
          placeholder="Opcional"
          errorText={fieldErrors.lent_to}
        />
      )}

      {/* === Datas de evento de empréstimo (borrowed/returned) === */}
      {(showBorrowedAt || showReturnedAt) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {showBorrowedAt && (
            <Input
              label="Data de início do empréstimo"
              name="borrowed_at"
              type="date"
              required={status === "borrowed"}
              value={borrowedAt}
              onChange={(e) => setBorrowedAt(e.target.value)}
              errorText={fieldErrors.borrowed_at}
            />
          )}
          {showReturnedAt && (
            <Input
              label="Data de devolução"
              name="returned_at"
              type="date"
              required
              value={returnedAt}
              onChange={(e) => setReturnedAt(e.target.value)}
              errorText={fieldErrors.returned_at}
            />
          )}
        </div>
      )}

      {/* === Origem + preço + datas de aquisição (estados com posse) === */}
      {showOrigin && (
        <div className="rounded-md border border-border bg-paper/40 p-4 space-y-4">
          <Select
            label="Origem da aquisição"
            name="purchase_origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value as PurchaseOrigin | "")}
            helperText="Como o livro entrou no acervo."
          >
            <option value="">— Não definir —</option>
            {PURCHASE_ORIGIN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showPrice && (
              <Input
                label={
                  showPriceRequired ? "Preço (R$)" : "Preço (opcional, R$)"
                }
                name="purchase_price"
                type="number"
                step="0.01"
                min="0"
                required={showPriceRequired}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex.: 45.90"
                errorText={fieldErrors.purchase_price}
              />
            )}

            {showAcquiredAt && (
              <Input
                label="Data de aquisição"
                name="acquired_at"
                type="date"
                value={acquiredAt}
                onChange={(e) => setAcquiredAt(e.target.value)}
                errorText={fieldErrors.acquired_at}
              />
            )}
          </div>

          {/* Datas de evento de saída (donated/sold/traded/lost) ou
              empréstimo pra fora (lent_out) — ficam dentro do bloco de
              origem porque conceitualmente estão ligadas ao livro "que era
              meu". */}
          {(showLentOutAt || showDisposedDate) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showLentOutAt && (
                <Input
                  label="Data em que emprestou"
                  name="lent_out_at"
                  type="date"
                  value={lentOutAt}
                  onChange={(e) => setLentOutAt(e.target.value)}
                  errorText={fieldErrors.lent_out_at}
                />
              )}
              {showDisposedDate && disposedConfig && (
                <Input
                  label={disposedConfig.label}
                  name="disposed_date"
                  type="date"
                  required
                  value={disposedDate}
                  onChange={(e) => setDisposedDate(e.target.value)}
                  errorText={fieldErrors.disposed_date}
                />
              )}
            </div>
          )}

          {/* Transição lent_out → owned: campo dedicado pra "voltou
              pro acervo". `acquired_at` mantém valor antigo (acima). */}
          {showReturnedToAcervoAt && transition && (
            <Input
              label={transition.label}
              name="returned_to_acervo_at"
              type="date"
              required
              value={returnedToAcervoAt}
              onChange={(e) => setReturnedToAcervoAt(e.target.value)}
              errorText={fieldErrors.returned_to_acervo_at}
              helperText="Captura quando o livro emprestado voltou — não regrava acquired_at."
            />
          )}

          {showSubscription && (
            <SubscriptionSelect
              value={subscriptionId}
              onChange={(id) => setSubscriptionId(id)}
              initialOptions={subscriptions}
              helperText="Qual assinatura trouxe esse livro."
              required
              errorText={fieldErrors.subscription_id}
            />
          )}
        </div>
      )}
    </div>
  );
}
