"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CubeIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Card, Button } from "@/components/ui";
import { updatePurchaseGroup } from "@/actions/updatePurchaseGroup";
import { formatBRL } from "@/utils/formatCurrency";
import { colorHexForName } from "@/utils/colorByHash";

export type BoxRow = {
  id: string;
  name: string;
  total_price: number;
  acquired_at: string | null;
  isbn: string | null;
  notes: string | null;
  books: { id: string; slug: string; title: string }[];
};

function formatDateBR(iso: string | null): string {
  if (!iso) return "—";
  // iso = "YYYY-MM-DD"
  return iso.split("-").reverse().join("/");
}

export default function BoxList({ initialRows }: { initialRows: BoxRow[] }) {
  const [rows, setRows] = useState(initialRows);

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {rows.map((row) => (
        <BoxItem
          key={row.id}
          row={row}
          onUpdated={(updated) =>
            setRows((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
            )
          }
        />
      ))}
    </ul>
  );
}

function BoxItem({
  row,
  onUpdated,
}: {
  row: BoxRow;
  onUpdated: (patch: Partial<BoxRow> & { id: string }) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<
    "date" | "name" | "total" | "isbn" | null
  >(null);
  const [dateValue, setDateValue] = useState(row.acquired_at ?? "");
  const [nameValue, setNameValue] = useState(row.name);
  const [totalValue, setTotalValue] = useState(String(row.total_price));
  const [isbnValue, setIsbnValue] = useState(row.isbn ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openEdit = (field: "date" | "name" | "total" | "isbn") => {
    setEditing(field);
    setError(null);
    if (field === "date") setDateValue(row.acquired_at ?? "");
    if (field === "name") setNameValue(row.name);
    if (field === "total") setTotalValue(String(row.total_price));
    if (field === "isbn") setIsbnValue(row.isbn ?? "");
  };

  const submit = () => {
    if (!editing) return;
    setError(null);
    const patch: Parameters<typeof updatePurchaseGroup>[1] = {};
    if (editing === "date") patch.acquired_at = dateValue.trim() || null;
    if (editing === "name") {
      if (!nameValue.trim()) {
        setError("Nome obrigatório.");
        return;
      }
      patch.name = nameValue.trim();
    }
    if (editing === "total") {
      const n = Number(totalValue);
      if (!Number.isFinite(n) || n < 0) {
        setError("Valor inválido.");
        return;
      }
      patch.total_price = n;
    }
    if (editing === "isbn") {
      patch.isbn = isbnValue.trim() || null;
    }
    startTransition(async () => {
      const result = await updatePurchaseGroup(row.id, patch);
      if (result.ok) {
        onUpdated({
          id: row.id,
          name: result.name,
          total_price: result.total_price,
          acquired_at: result.acquired_at,
          isbn: result.isbn,
        });
        setEditing(null);
        // Refresh do servidor pra que o `purchase_price` dos livros (se houver
        // recálculo necessário) seja propagado em outras views. A action
        // `updatePurchaseGroup` em si só mexe no grupo, então `redistribute`
        // não roda automaticamente — mas se quiser garantir, dá pra acionar
        // via outro endpoint. Por ora, só refresca pra a próxima navegação.
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  const cancel = () => {
    setEditing(null);
    setError(null);
  };

  // Cor hash-based pelo nome do box — cada box vira um "marcador" único.
  // Estável entre renders (mesmo nome → mesma cor sempre).
  const accentColor = colorHexForName(row.name);

  return (
    <Card
      className="border-l-[3px]"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="flex items-start gap-4 flex-wrap">
        <CubeIcon
          className="w-6 h-6 flex-shrink-0 mt-1"
          style={{ color: accentColor }}
          aria-hidden
        />

        <div className="flex-1 min-w-0 space-y-2">
          {/* Nome */}
          {editing === "name" ? (
            <InlineEdit
              value={nameValue}
              onValueChange={setNameValue}
              onSubmit={submit}
              onCancel={cancel}
              isPending={isPending}
              type="text"
              ariaLabel="Editar nome do box"
              className="text-xl font-display text-ink-deep"
            />
          ) : (
            <button
              type="button"
              onClick={() => openEdit("name")}
              className="group inline-flex items-center gap-1.5 font-display text-xl text-ink-deep hover:text-gold-deep transition-colors"
              title="Editar nome"
            >
              <span>{row.name}</span>
              <PencilSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {/* Total */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider text-ink-fade">
                Total:
              </span>
              {editing === "total" ? (
                <InlineEdit
                  value={totalValue}
                  onValueChange={setTotalValue}
                  onSubmit={submit}
                  onCancel={cancel}
                  isPending={isPending}
                  type="number"
                  ariaLabel="Editar valor total"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => openEdit("total")}
                  className="group inline-flex items-center gap-1 text-ink-deep hover:text-gold-deep transition-colors"
                  title="Editar valor total"
                >
                  <span className="font-medium">
                    {formatBRL(row.total_price)}
                  </span>
                  <PencilSquareIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* Data */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider text-ink-fade">
                Data:
              </span>
              {editing === "date" ? (
                <InlineEdit
                  value={dateValue}
                  onValueChange={setDateValue}
                  onSubmit={submit}
                  onCancel={cancel}
                  isPending={isPending}
                  type="date"
                  ariaLabel="Editar data de aquisição"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => openEdit("date")}
                  className="group inline-flex items-center gap-1 text-ink-deep hover:text-gold-deep transition-colors"
                  title="Editar data"
                >
                  <span
                    className={
                      row.acquired_at ? "font-medium" : "italic text-ink-fade"
                    }
                  >
                    {row.acquired_at
                      ? formatDateBR(row.acquired_at)
                      : "sem data"}
                  </span>
                  <PencilSquareIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* Livros */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider text-ink-fade">
                Livros:
              </span>
              <span className="font-medium text-ink-deep">
                {row.books.length}
              </span>
            </div>

            {/* ISBN do box */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider text-ink-fade">
                ISBN:
              </span>
              {editing === "isbn" ? (
                <InlineEdit
                  value={isbnValue}
                  onValueChange={setIsbnValue}
                  onSubmit={submit}
                  onCancel={cancel}
                  isPending={isPending}
                  type="text"
                  ariaLabel="Editar ISBN do box"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => openEdit("isbn")}
                  className="group inline-flex items-center gap-1 text-ink-deep hover:text-gold-deep transition-colors"
                  title="Editar ISBN do box"
                >
                  <span
                    className={
                      row.isbn ? "font-medium" : "italic text-ink-fade"
                    }
                  >
                    {row.isbn ?? "sem ISBN"}
                  </span>
                  <PencilSquareIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-burgundy">{error}</p>}

          {row.books.length > 0 && (
            <ul className="columns-2 sm:columns-3 gap-x-4 mt-2">
              {row.books.map((b) => (
                <li key={b.id} className="break-inside-avoid leading-snug">
                  <Link
                    href={`/book/${b.slug}`}
                    className="text-sm italic text-ink-soft hover:text-gold-deep transition-colors"
                  >
                    · {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function InlineEdit({
  value,
  onValueChange,
  onSubmit,
  onCancel,
  isPending,
  type,
  ariaLabel,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  type: "text" | "date" | "number";
  ariaLabel: string;
  className?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type={type}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        autoFocus
        aria-label={ariaLabel}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        className={`rounded border border-border bg-ivory-light px-2 py-1 text-sm text-ink-deep focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none ${className ?? ""}`}
      />
      <Button
        type="button"
        size="sm"
        variant="primary"
        onClick={onSubmit}
        loading={isPending}
        aria-label="Salvar"
      >
        <CheckIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onCancel}
        aria-label="Cancelar"
      >
        <XMarkIcon className="w-4 h-4" />
      </Button>
    </span>
  );
}
