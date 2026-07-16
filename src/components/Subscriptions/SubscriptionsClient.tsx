"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  BookOpenIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/components/forms/Modal";
import { BookCoverFallback } from "@/components/ui";
import { updateSubscription } from "@/actions/updateSubscription";
import { createSubscription } from "@/actions/createSubscription";
import { formatBRL } from "@/utils/formatCurrency";
import type {
  SubscriptionWithStats,
  SubscriptionBook,
} from "@/services/subscriptionList";

type Props = {
  subscriptions: SubscriptionWithStats[];
};

export default function SubscriptionsClient({ subscriptions }: Props) {
  return (
    <div className="font-body space-y-6">
      <NewSubscriptionForm />

      {subscriptions.length === 0 ? (
        <p className="text-sm italic text-ink-fade">
          Nenhuma assinatura ainda. Crie a primeira acima.
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((s) => (
            <SubscriptionCard key={s.id} sub={s} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nova assinatura
// ---------------------------------------------------------------------------
function NewSubscriptionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [priceDigits, setPriceDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (!name.trim()) {
      setError("Nome obrigatório.");
      return;
    }
    const cents = priceDigits ? Number(priceDigits) : 0;
    const price = priceDigits ? cents / 100 : null;
    startTransition(async () => {
      const result = await createSubscription({
        name: name.trim(),
        monthly_price: price,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setName("");
      setPriceDigits("");
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#6D3914]/40 bg-[#6D3914]/10 text-[#6D3914] text-sm hover:bg-[#6D3914]/15 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Nova assinatura
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-ivory-light p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <div>
          <label className="block text-xs text-ink-fade mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: TAG Curadoria"
            autoFocus
            className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-fade mb-1">
            Valor mensal
          </label>
          <PriceInput digits={priceDigits} onDigits={setPriceDigits} />
        </div>
      </div>
      {error && <p className="text-xs text-burgundy">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="px-3 py-1.5 rounded-md text-sm text-ink-soft hover:text-ink-deep transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="px-4 py-1.5 rounded-md text-sm bg-[#6D3914] text-ivory hover:bg-[#4C2B08] disabled:opacity-50 transition-colors"
        >
          {pending ? "Criando…" : "Criar"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card editável de assinatura
// ---------------------------------------------------------------------------
function SubscriptionCard({ sub }: { sub: SubscriptionWithStats }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState(sub.name);
  const [priceDigits, setPriceDigits] = useState(
    sub.monthly_price != null ? String(Math.round(sub.monthly_price * 100)) : "",
  );
  const [notes, setNotes] = useState(sub.notes ?? "");
  const [active, setActive] = useState(sub.active);
  const [error, setError] = useState<string | null>(null);
  const [booksOpen, setBooksOpen] = useState(false);

  const save = (patch: {
    name?: string;
    monthly_price?: number | null;
    notes?: string | null;
    active?: boolean;
  }) => {
    setError(null);
    startTransition(async () => {
      const result = await updateSubscription(sub.id, patch);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  const saveName = () => {
    if (name.trim() && name.trim() !== sub.name) save({ name: name.trim() });
  };
  const savePrice = () => {
    const price = priceDigits ? Number(priceDigits) / 100 : null;
    if (price !== sub.monthly_price) save({ monthly_price: price });
  };
  const saveNotes = () => {
    const n = notes.trim() || null;
    if (n !== (sub.notes ?? null)) save({ notes: n });
  };
  const toggleActive = () => {
    const next = !active;
    setActive(next);
    save({ active: next });
  };

  return (
    <li
      className={`rounded-lg border p-4 space-y-3 ${
        active
          ? "border-border bg-ivory-light"
          : "border-border bg-paper-soft/50 opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="flex-1 min-w-0 font-display text-lg text-ink-deep bg-transparent border-b border-transparent hover:border-border focus:border-[#6D3914] outline-none transition-colors"
        />
        <label className="flex items-center gap-1.5 text-xs text-ink-fade flex-shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={toggleActive}
            className="w-4 h-4 rounded border-border accent-[#6D3914] cursor-pointer"
          />
          ativa
        </label>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-ink-fade w-24 flex-shrink-0">
          Valor mensal
        </label>
        <PriceInput
          digits={priceDigits}
          onDigits={setPriceDigits}
          onBlur={savePrice}
        />
      </div>

      <div>
        <label className="block text-xs text-ink-fade mb-1">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={2}
          placeholder="Opcional"
          className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-1 focus:ring-[#6D3914]/30 outline-none resize-none"
        />
      </div>

      {error && <p className="text-xs text-burgundy">{error}</p>}

      <div className="flex items-center gap-4 pt-2 border-t border-border text-sm text-ink-soft">
        <button
          type="button"
          onClick={() => sub.book_count > 0 && setBooksOpen(true)}
          disabled={sub.book_count === 0}
          className="inline-flex items-center gap-1.5 hover:text-[#6D3914] transition-colors disabled:hover:text-ink-soft disabled:cursor-default"
          title={sub.book_count > 0 ? "Ver livros" : undefined}
        >
          <BookOpenIcon className="w-4 h-4 text-[#6D3914]" />
          <span className={sub.book_count > 0 ? "underline underline-offset-2 decoration-dotted" : ""}>
            {sub.book_count} {sub.book_count === 1 ? "livro" : "livros"}
          </span>
        </button>
        <span className="inline-flex items-center gap-1.5">
          <BanknotesIcon className="w-4 h-4 text-[#6D3914]" />
          {formatBRL(sub.total_spent)} gastos
        </span>
      </div>

      {booksOpen && (
        <SubscriptionBooksModal
          name={sub.name}
          books={sub.books}
          totalSpent={sub.total_spent}
          onClose={() => setBooksOpen(false)}
        />
      )}
      <p className="text-[11px] italic text-ink-fade">
        Mudar o valor não altera livros já cadastrados — só vale daqui pra frente.
      </p>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Modal com os livros da assinatura
// ---------------------------------------------------------------------------
function SubscriptionBooksModal({
  name,
  books,
  totalSpent,
  onClose,
}: {
  name: string;
  books: SubscriptionBook[];
  totalSpent: number;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={`Livros · ${name}`} size="md">
      <div className="space-y-3">
        <p className="text-sm text-ink-fade">
          {books.length} {books.length === 1 ? "livro" : "livros"} ·{" "}
          {formatBRL(totalSpent)} no total
        </p>
        <ul className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {books.map((b) => (
            <li key={b.id}>
              <Link
                href={`/book/${b.slug}`}
                className="flex items-center gap-3 rounded-md border border-border bg-ivory-light p-2 hover:border-[#6D3914] transition-colors group"
              >
                <span
                  className="w-9 flex-shrink-0 relative rounded-sm overflow-hidden border border-ink-deep/15"
                  style={{ aspectRatio: "2 / 3" }}
                >
                  {b.cover_url ? (
                    <Image
                      src={b.cover_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  ) : (
                    <BookCoverFallback
                      title={b.title}
                      size="sm"
                      className="w-full h-full"
                    />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-ink-deep leading-tight line-clamp-2 group-hover:text-[#6D3914] transition-colors">
                    {b.title}
                  </span>
                  {b.acquired_at && (
                    <span className="text-[11px] text-ink-fade">
                      {b.acquired_at.split("-").reverse().join("/")}
                    </span>
                  )}
                </span>
                <span className="text-sm flex-shrink-0 tabular-nums text-right">
                  {b.counts_price ? (
                    <span className="text-ink-soft">
                      {b.purchase_price != null
                        ? formatBRL(b.purchase_price)
                        : "—"}
                    </span>
                  ) : (
                    <span className="text-[11px] italic text-ink-fade">
                      mesma edição
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Input de preço com máscara de centavos (R$)
// ---------------------------------------------------------------------------
function PriceInput({
  digits,
  onDigits,
  onBlur,
}: {
  digits: string;
  onDigits: (d: string) => void;
  onBlur?: () => void;
}) {
  const cents = digits ? Number(digits) : 0;
  const display = digits
    ? (cents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";
  return (
    <div className="relative flex-1">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-fade text-sm">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => onDigits(e.target.value.replace(/\D/g, ""))}
        onBlur={onBlur}
        placeholder="0,00"
        className="w-full rounded-md border border-border bg-paper-soft pl-9 pr-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
      />
    </div>
  );
}
