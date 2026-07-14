"use client";

import { useState } from "react";
import Modal from "@/components/forms/Modal";
import { Button } from "@/components/ui";
import { logPlanDayReading } from "@/actions/logPlanDayReading";
import { setPlanDayOverride } from "@/actions/setPlanDayOverride";
import type { DayCell } from "@/utils/readingPlan";
import type { PlanBookRow } from "@/services/readingPlanData";

const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function longDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const wd = WEEKDAYS[d.getUTCDay()];
  return `${wd}, ${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

type Props = {
  cell: DayCell;
  books: PlanBookRow[];
  year: number;
  month: number;
  dailyTarget: number;
  onClose: () => void;
  /** Planejado salvo: atualiza override local. */
  onSavedPlan: (bookId: string, iso: string, pages: number) => void;
  /** Lido salvo: atualiza real local. */
  onSavedActual: (bookId: string, iso: string, pages: number) => void;
};

/**
 * Modal do dia: PLANEJAR (quanto pretendo ler de cada livro nesse dia — item 3)
 * e REGISTRAR (quanto li de verdade). O planejado grava override; o lido grava
 * no reading_progress_log.
 */
export default function DayLogModal({
  cell,
  books,
  year,
  month,
  dailyTarget,
  onClose,
  onSavedPlan,
  onSavedActual,
}: Props) {
  const readable = books.filter(
    (b) => b.total_pages !== null && b.total_pages > 0,
  );
  const plannedIds = new Set(cell.entries.map((e) => e.book_id));
  const ordered = [...readable].sort((a, b) => {
    const ap = plannedIds.has(a.book_id) ? 0 : 1;
    const bp = plannedIds.has(b.book_id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  const plannedFor = (bookId: string) =>
    cell.entries.find((e) => e.book_id === bookId)?.pages ?? 0;
  const actualFor = (bookId: string) =>
    cell.actualEntries.find((a) => a.book_id === bookId)?.pages ?? 0;

  const initPlan: Record<string, string> = {};
  const initActual: Record<string, string> = {};
  for (const b of ordered) {
    const p = plannedFor(b.book_id);
    const a = actualFor(b.book_id);
    initPlan[b.book_id] = p > 0 ? String(p) : "";
    initActual[b.book_id] = a > 0 ? String(a) : "";
  }
  const [plan, setPlan] = useState<Record<string, string>>(initPlan);
  const [actual, setActual] = useState<Record<string, string>>(initActual);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPlan = ordered.reduce(
    (s, b) => s + (Number(plan[b.book_id]) || 0),
    0,
  );
  const totalActual = ordered.reduce(
    (s, b) => s + (Number(actual[b.book_id]) || 0),
    0,
  );
  const free = dailyTarget - totalPlan;
  const isPast = cell.isPast;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      for (const b of ordered) {
        // Planejado (override) — só se o usuário mexeu. Campo vazio = remove o
        // override (volta pro ritmo uniforme). Número (incl. 0) = fixa.
        const planRaw = plan[b.book_id] ?? "";
        if (planRaw !== (initPlan[b.book_id] ?? "")) {
          const pages = planRaw === "" ? null : Number(planRaw);
          const res = await setPlanDayOverride({
            year,
            month,
            book_id: b.book_id,
            day: cell.iso,
            pages: pages !== null && Number.isFinite(pages) ? Math.max(0, pages) : null,
          });
          if (!res.ok) {
            setError(res.message);
            setSaving(false);
            return;
          }
          onSavedPlan(b.book_id, cell.iso, pages ?? -1);
        }

        // Lido (real) — só em dias que já passaram e se mudou.
        if (isPast) {
          const actRaw = actual[b.book_id] ?? "";
          if (actRaw !== (initActual[b.book_id] ?? "")) {
            const actPages = actRaw === "" ? 0 : Number(actRaw);
            if (!Number.isFinite(actPages)) continue;
            const res = await logPlanDayReading({
              book_id: b.book_id,
              book_slug: b.slug,
              log_date: cell.iso,
              pages: Math.max(0, actPages),
            });
            if (!res.ok) {
              setError(res.message);
              setSaving(false);
              return;
            }
            onSavedActual(b.book_id, cell.iso, Math.max(0, actPages));
          }
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={longDayLabel(cell.iso)} size="sm">
      <div className="space-y-3">
        {/* Resumo do dia: planejado × meta → livre */}
        <div className="rounded-md bg-paper-soft border border-border px-3 py-2 text-sm flex items-center justify-between">
          <span className="text-ink-fade">
            Planejado: <span className="text-ink-deep font-medium">{totalPlan}p</span>
            {" · "}meta {dailyTarget}p
          </span>
          <span
            className={
              free > 0
                ? "text-[#6D3914]"
                : free < 0
                  ? "text-burgundy"
                  : "text-moss"
            }
          >
            {free > 0 && `${free}p livres`}
            {free < 0 && `${-free}p acima`}
            {free === 0 && "no ponto ✓"}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-1 items-center">
          <span className="text-[11px] uppercase tracking-wider text-ink-fade">
            Livro
          </span>
          <span className="text-[11px] uppercase tracking-wider text-ink-fade text-center w-16">
            Plano
          </span>
          <span className="text-[11px] uppercase tracking-wider text-ink-fade text-center w-16">
            {isPast ? "Lido" : ""}
          </span>

          {ordered.map((b) => (
            <PlanRow
              key={b.book_id}
              title={b.title}
              color={b.color}
              planValue={plan[b.book_id] ?? ""}
              actualValue={actual[b.book_id] ?? ""}
              showActual={isPast}
              onPlan={(v) => setPlan((p) => ({ ...p, [b.book_id]: v }))}
              onActual={(v) => setActual((p) => ({ ...p, [b.book_id]: v }))}
            />
          ))}
        </div>

        {ordered.length === 0 && (
          <p className="text-sm italic text-ink-fade py-2">
            Nenhum livro com número de páginas no plano deste mês.
          </p>
        )}

        {isPast && (
          <p className="text-xs text-ink-fade">
            Lido total do dia:{" "}
            <span className="font-medium text-ink-deep">{totalActual}p</span>
          </p>
        )}

        {error && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
          >
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PlanRow({
  title,
  color,
  planValue,
  actualValue,
  showActual,
  onPlan,
  onActual,
}: {
  title: string;
  color: string;
  planValue: string;
  actualValue: string;
  showActual: boolean;
  onPlan: (v: string) => void;
  onActual: (v: string) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 min-w-0 py-1">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="text-sm text-ink-deep truncate">{title}</span>
      </div>
      <input
        type="number"
        min={0}
        value={planValue}
        onChange={(e) => onPlan(e.target.value)}
        placeholder="0"
        className="w-16 rounded border border-border bg-paper-soft px-2 py-1 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-1 focus:ring-[#6D3914]/30 outline-none text-center"
      />
      {showActual ? (
        <input
          type="number"
          min={0}
          value={actualValue}
          onChange={(e) => onActual(e.target.value)}
          placeholder="0"
          className="w-16 rounded border border-moss/40 bg-moss/[0.04] px-2 py-1 text-sm text-ink-deep focus:border-moss focus:ring-1 focus:ring-moss/30 outline-none text-center"
        />
      ) : (
        <span className="w-16" />
      )}
    </>
  );
}
