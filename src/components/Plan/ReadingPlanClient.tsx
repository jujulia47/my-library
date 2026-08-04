"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import { addMonthsISO } from "@/utils/dates";
import Modal from "@/components/forms/Modal";
import { Button, BookCoverFallback } from "@/components/ui";
import { IconActionButton } from "@/components/ui/IconActionButton";
import {
  buildMonthPlan,
  deriveBookTargets,
  formatReadingTime,
  inclusiveDays,
  isoForDay,
  addDaysISO,
  scheduledMetaPage,
  daysInMonth,
  monthNamePT,
  SECONDS_PER_PAGE,
  type CapacityPeriod,
  type PlanBookInput,
  type TargetInput,
  type TargetStats,
} from "@/utils/readingPlan";
import type { ReadingPlanData } from "@/services/readingPlanData";
import {
  upsertReadingTarget,
  type ReadingTargetInput,
} from "@/actions/upsertReadingTarget";
import { deleteReadingTarget } from "@/actions/deleteReadingTarget";
import { carryOverReadingTarget } from "@/actions/carryOverReadingTarget";
import { replanReadingTarget } from "@/actions/replanReadingTarget";
import { setPlanBookPages } from "@/actions/setPlanBookPages";
import {
  upsertReadingCapacity,
  type ReadingCapacityInput,
} from "@/actions/upsertReadingCapacity";
import { deleteReadingCapacity } from "@/actions/deleteReadingCapacity";
import { moveNextRead } from "@/actions/moveNextRead";
import { addHomeNextRead } from "@/actions/addHomeNextRead";
import { removeHomeNextRead } from "@/actions/removeHomeNextRead";
import type { BookSearchOption } from "@/app/api/books/search/route";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function ddmm(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

type Props = {
  data: ReadingPlanData;
  todayISO: string;
};

export default function ReadingPlanClient({ data, todayISO }: Props) {
  const { books, capacity, monthISO, isCurrentMonth } = data;
  const router = useRouter();

  const year = Number(monthISO.slice(0, 4));
  const month = Number(monthISO.slice(5, 7));
  const currentMonthISO = `${todayISO.slice(0, 7)}-01`;
  const isPast = monthISO < currentMonthISO;
  // Meses passados são só leitura (registro histórico).
  const editable = !isPast;

  const plan = useMemo(
    () => buildMonthPlan(year, month, books, capacity, todayISO),
    [year, month, books, capacity, todayISO],
  );

  // Modais.
  const [targetModal, setTargetModal] = useState<{
    book: PlanBookInput;
    target: TargetInput | null;
  } | null>(null);
  const [capacityModal, setCapacityModal] = useState<{
    period: CapacityPeriod | null;
  } | null>(null);
  const [addBookOpen, setAddBookOpen] = useState(false);

  const refresh = () => router.refresh();
  const goToMonth = (iso: string) => {
    router.push(`/plano?mes=${iso.slice(0, 7)}`);
  };

  return (
    <div className="font-body">
      <header className="pb-4 border-b border-border">
        <p className="font-body text-xs uppercase tracking-[0.25em] text-ink-fade">
          Plano de leitura
        </p>
        <div className="flex items-center justify-between gap-3 mt-1">
          <h1 className="font-display text-3xl md:text-4xl text-ink-deep leading-tight">
            {monthNamePT(month)} {year}
          </h1>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => goToMonth(addMonthsISO(monthISO, -1))}
              className="p-1.5 rounded-md text-ink-fade hover:text-ink-deep hover:bg-paper-soft transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => goToMonth(currentMonthISO)}
                className="px-2 py-1 text-xs rounded-md text-gold-deep hover:bg-paper-soft transition-colors"
              >
                hoje
              </button>
            )}
            <button
              type="button"
              onClick={() => goToMonth(addMonthsISO(monthISO, 1))}
              className="p-1.5 rounded-md text-ink-fade hover:text-ink-deep hover:bg-paper-soft transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        {isPast && (
          <p className="mt-1 text-sm text-ink-fade italic">
            Mês passado — só visualização.
          </p>
        )}
      </header>

      {isCurrentMonth && (
        <TodayPanel
          books={books}
          plan={plan}
          todayISO={todayISO}
          onChanged={refresh}
        />
      )}

      <SummaryStrip plan={plan} totalBooks={books.length} />

      <CapacitySection
        capacity={capacity}
        plan={plan}
        todayISO={todayISO}
        editable={editable}
        onAdd={() => setCapacityModal({ period: null })}
        onEdit={(period) => setCapacityModal({ period })}
        onDeleted={refresh}
      />

      <BooksSection
        books={books}
        plan={plan}
        todayISO={todayISO}
        monthISO={monthISO}
        editable={editable}
        onAddBook={() => setAddBookOpen(true)}
        onNewTarget={(book) => setTargetModal({ book, target: null })}
        onEditTarget={(book, target) => setTargetModal({ book, target })}
        onChanged={refresh}
      />

      <CalendarSection plan={plan} todayISO={todayISO} />

      {targetModal && (
        <TargetModal
          book={targetModal.book}
          target={targetModal.target}
          todayISO={todayISO}
          onClose={() => setTargetModal(null)}
          onSaved={() => {
            setTargetModal(null);
            refresh();
          }}
        />
      )}
      {capacityModal && (
        <CapacityModal
          period={capacityModal.period}
          year={year}
          month={month}
          todayISO={todayISO}
          onClose={() => setCapacityModal(null)}
          onSaved={() => {
            setCapacityModal(null);
            refresh();
          }}
        />
      )}
      {addBookOpen && (
        <AddBookModal
          existingIds={new Set(books.map((b) => b.book_id))}
          monthISO={monthISO}
          onClose={() => setAddBookOpen(false)}
          onAdded={() => {
            setAddBookOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Hoje — a visão diária. Cota fixa: não se recalcula ao longo do dia.
// ============================================================================
type TodayRow = {
  book: PlanBookInput;
  /** Meta ativa do livro (null = livro de fila). */
  stats: TargetStats | null;
  /** Páginas planejadas pra hoje. */
  quota: number;
  readToday: number;
  done: boolean;
  ahead: number;
  backlog: number;
  targetPage: number | null;
  kind: "meta" | "fila";
};

function buildTodayRows(
  books: PlanBookInput[],
  plan: ReturnType<typeof buildMonthPlan>,
  todayISO: string,
): TodayRow[] {
  const rows: TodayRow[] = [];
  const today = plan.days.find((d) => d.iso === todayISO);

  for (const book of books) {
    if (book.total_pages === null || book.total_pages <= 0) continue;
    const stats = deriveBookTargets(
      book.targets,
      book.current_page,
      todayISO,
      book.pages_read_today,
    );
    const active = stats.find(
      (s) => s.status === "em_dia" || s.status === "atrasada",
    );

    if (active) {
      if ((active.todayQuota ?? 0) <= 0 && active.backlog <= 0) continue;
      rows.push({
        book,
        stats: active,
        quota: active.todayQuota ?? 0,
        readToday: active.readToday,
        done: active.doneToday,
        ahead: active.aheadToday,
        backlog: active.backlog,
        targetPage: active.targetPageToday,
        kind: "meta",
      });
      continue;
    }

    // Livro de fila: a cota de hoje vem do calendário (sobra da capacidade).
    if (book.targets.length === 0 && today) {
      const entry = today.entries.find(
        (e) => e.book_id === book.book_id && e.kind === "fila",
      );
      if (!entry) continue;
      rows.push({
        book,
        stats: null,
        quota: entry.pages,
        readToday: book.pages_read_today,
        done: book.pages_read_today >= entry.pages,
        ahead: Math.max(0, book.pages_read_today - entry.pages),
        backlog: 0,
        targetPage: null,
        kind: "fila",
      });
    }
  }
  return rows;
}

function TodayPanel({
  books,
  plan,
  todayISO,
  onChanged,
}: {
  books: PlanBookInput[];
  plan: ReturnType<typeof buildMonthPlan>;
  todayISO: string;
  onChanged: () => void;
}) {
  const [, startTransition] = useTransition();
  const rows = buildTodayRows(books, plan, todayISO);

  // O orçamento do dia é GERAL — vale pra qualquer livro (meta OU fila).
  // Então "lido hoje" soma TUDO que você leu no dia (mesmo de meta já
  // concluída/adiantada, que não vira linha), contra o orçamento do dia.
  const dailyBudget =
    plan.days.find((d) => d.iso === todayISO)?.budget ?? 0;
  const totalRead = books.reduce((s, b) => s + b.pages_read_today, 0);
  const totalRemaining = Math.max(0, dailyBudget - totalRead);
  const totalTarget = Math.max(dailyBudget, totalRead);
  const allDone = rows.length > 0 && rows.every((r) => r.done);

  const handleReplan = (targetId: string) => {
    startTransition(async () => {
      const res = await replanReadingTarget(targetId);
      if (res.ok) onChanged();
    });
  };

  if (rows.length === 0) {
    return (
      <section className="mt-5 rounded-lg border border-border bg-ivory-light p-4">
        <p className="text-xs uppercase tracking-wider text-ink-fade">
          Hoje · {ddmm(todayISO)}
        </p>
        <p className="text-sm text-ink-fade italic mt-2">
          Nada planejado pra hoje. Defina uma capacidade ou crie uma meta.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-lg border border-[#6D3914]/30 bg-ivory-light p-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-xs uppercase tracking-wider text-ink-fade">
          Hoje · {ddmm(todayISO)}
        </p>
        <p className="text-sm">
          {allDone ? (
            <span className="text-moss font-medium">
              tudo de hoje cumprido ✓
            </span>
          ) : (
            <span className="text-ink-soft">
              <span className="font-medium text-ink-deep">{totalRead}</span> de{" "}
              {totalTarget} páginas · ~
              {formatReadingTime(totalRemaining * SECONDS_PER_PAGE)}{" "}
              restantes
            </span>
          )}
        </p>
      </div>

      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li
            key={r.book.book_id}
            className={clsx(
              "rounded-md border px-3 py-2",
              r.done
                ? "border-moss/30 bg-moss/[0.05]"
                : "border-border bg-paper-soft/40",
            )}
          >
            <div className="flex items-start gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: r.book.color }}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <Link
                    href={`/book/${r.book.slug}`}
                    className="text-sm text-ink-deep hover:text-[#6D3914] transition-colors truncate"
                  >
                    {r.book.title}
                  </Link>
                  {r.kind === "fila" && (
                    <span className="text-[11px] text-ink-fade italic">
                      fila
                    </span>
                  )}
                </div>

                <p className="text-sm mt-0.5">
                  {r.done ? (
                    <span className="text-moss">
                      cota de hoje cumprida ✓ · leu {r.readToday}p
                      {r.ahead > 0 && (
                        <span className="text-ink-soft">
                          {" "}
                          ({r.ahead}p adiantada)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-ink-soft">
                      ler{" "}
                      <span className="font-medium text-[#6D3914]">
                        {Math.max(0, r.quota - r.readToday)} páginas
                      </span>
                      {r.targetPage !== null && (
                        <> · até a página {r.targetPage}</>
                      )}
                      {r.readToday > 0 && (
                        <span className="text-ink-fade">
                          {" "}
                          (já leu {r.readToday}p de {r.quota})
                        </span>
                      )}
                    </span>
                  )}
                </p>

                {r.backlog > 0 && (
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-burgundy">
                      ⚠ atrasado: {r.backlog}p de dias anteriores
                    </span>
                    {r.stats && (
                      <button
                        type="button"
                        onClick={() => handleReplan(r.stats!.target.id)}
                        className="inline-flex items-center gap-1 text-xs text-gold-deep hover:text-ink-deep transition-colors underline underline-offset-2"
                      >
                        <ArrowUturnRightIcon className="w-3.5 h-3.5" />
                        recalcular nos dias restantes
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================================
// Resumo estático — o dado de referência
// ============================================================================
function SummaryStrip({
  plan,
  totalBooks,
}: {
  plan: ReturnType<typeof buildMonthPlan>;
  totalBooks: number;
}) {
  const capDiff =
    plan.capacityTotal !== null
      ? plan.capacityTotal - plan.monthPageTotal
      : null;

  return (
    <section className="mt-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<BookOpenIcon className="w-5 h-5" />}
          label="Livros no plano"
          value={String(totalBooks)}
          hint={
            plan.booksWithoutPages > 0
              ? `${plan.booksWithoutPages} sem nº de páginas`
              : undefined
          }
        />
        <StatCard
          icon={<DocumentTextIcon className="w-5 h-5" />}
          label="Páginas neste mês"
          value={plan.monthPageTotal.toLocaleString("pt-BR")}
          hint="metas contam só a fatia do mês"
        />
        <StatCard
          icon={<span className="font-display text-lg leading-none">÷</span>}
          label="Média necessária"
          value={`${plan.neededAvg} pág/dia`}
          hint={`pra ler o mês em ${plan.remainingDaysInMonth} dias`}
        />
        <StatCard
          icon={<ClockIcon className="w-5 h-5" />}
          label="Tempo do mês"
          value={formatReadingTime(plan.monthPageTotal * SECONDS_PER_PAGE)}
          hint="pior caso · 1m20/pág"
        />
      </div>

      {/* Aviso capacidade × necessário */}
      {plan.capacityTotal !== null && capDiff !== null && (
        <p
          className={clsx(
            "mt-2 text-sm rounded-md border px-3 py-2",
            capDiff >= 0
              ? "border-moss/40 bg-moss/[0.06] text-moss"
              : "border-burgundy/40 bg-burgundy/[0.06] text-burgundy",
          )}
        >
          Sua capacidade planejada cobre{" "}
          {plan.capacityTotal.toLocaleString("pt-BR")} páginas até o fim do mês —{" "}
          {capDiff >= 0
            ? `${capDiff.toLocaleString("pt-BR")} acima do necessário ✓`
            : `faltam ${Math.abs(capDiff).toLocaleString("pt-BR")} pra cobrir todos os livros`}
        </p>
      )}
      {plan.daysOverCapacity.length > 0 && (
        <p className="mt-2 text-sm rounded-md border border-burgundy/40 bg-burgundy/[0.06] text-burgundy px-3 py-2">
          Atenção: em {plan.daysOverCapacity.length}{" "}
          {plan.daysOverCapacity.length === 1 ? "dia" : "dias"} as metas sozinhas
          passam da sua capacidade ({plan.daysOverCapacity.map(ddmm).join(", ")}).
        </p>
      )}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-ivory-light p-3">
      <div className="flex items-center gap-1.5 text-ink-fade">
        <span className="text-[#6D3914]">{icon}</span>
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-2xl text-ink-deep mt-1 leading-none">
        {value}
      </p>
      {hint && <p className="text-xs italic text-ink-fade mt-1">{hint}</p>}
    </div>
  );
}

// ============================================================================
// Capacidade — períodos de páginas/dia
// ============================================================================
function CapacitySection({
  capacity,
  plan,
  todayISO,
  editable,
  onAdd,
  onEdit,
  onDeleted,
}: {
  capacity: CapacityPeriod[];
  plan: ReturnType<typeof buildMonthPlan>;
  todayISO: string;
  editable: boolean;
  onAdd: () => void;
  onEdit: (period: CapacityPeriod) => void;
  onDeleted: () => void;
}) {
  const [, startTransition] = useTransition();
  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteReadingCapacity(id);
      if (res.ok) onDeleted();
    });
  };

  // Sem capacidade e mês só-leitura: não polui com CTA.
  if (!editable && capacity.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm uppercase tracking-wider text-ink-fade">
          Minha capacidade
        </h2>
        {editable && (
          <button
            type="button"
            onClick={onAdd}
            className="text-sm text-gold-deep hover:text-ink-deep transition-colors inline-flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            Adicionar período
          </button>
        )}
      </div>

      {capacity.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="w-full rounded-lg border-2 border-dashed border-border hover:border-[#6D3914]/50 hover:bg-[#6D3914]/[0.03] transition-colors p-4 text-center text-sm text-ink-fade"
        >
          Quantas páginas por dia você consegue ler? Defina sua capacidade — é
          ela que alimenta a fila de leitura.
        </button>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {capacity.map((p) => {
            const isPast = p.end_date < todayISO;
            return (
              <li
                key={p.id}
                className={clsx(
                  "group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  isPast
                    ? "border-border bg-paper-soft/60 text-ink-fade"
                    : "border-[#6D3914]/30 bg-[#6D3914]/[0.05] text-ink-deep",
                )}
              >
                <span className="font-medium">{p.pages_per_day} pág/dia</span>
                <span className="text-ink-fade">
                  {ddmm(p.start_date)}–{ddmm(p.end_date)}
                </span>
                {editable && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="text-ink-fade hover:text-ink-deep transition-colors"
                      aria-label="Editar período"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-ink-fade hover:text-burgundy transition-colors"
                      aria-label="Remover período"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ============================================================================
// Livros — metas e fila
// ============================================================================
function BooksSection({
  books,
  plan,
  todayISO,
  monthISO,
  editable,
  onAddBook,
  onNewTarget,
  onEditTarget,
  onChanged,
}: {
  books: PlanBookInput[];
  plan: ReturnType<typeof buildMonthPlan>;
  todayISO: string;
  monthISO: string;
  editable: boolean;
  onAddBook: () => void;
  onNewTarget: (book: PlanBookInput) => void;
  onEditTarget: (book: PlanBookInput, target: TargetInput) => void;
  onChanged: () => void;
}) {
  // Livros com meta primeiro; depois a fila em ordem.
  const withTargets = books.filter((b) => b.targets.length > 0);
  const queue = books
    .filter((b) => b.targets.length === 0)
    .sort((a, z) => a.position - z.position);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm uppercase tracking-wider text-ink-fade">
          Livros do mês
        </h2>
        {editable && (
          <button
            type="button"
            onClick={onAddBook}
            className="text-sm text-gold-deep hover:text-ink-deep transition-colors inline-flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            Adicionar livro
          </button>
        )}
      </div>

      {books.length === 0 ? (
        <div className="rounded-lg border border-border bg-paper p-8 text-center">
          <p className="font-display italic text-ink-soft">
            {editable
              ? "Nenhum livro no plano deste mês."
              : "Nenhum livro planejado neste mês."}
          </p>
          {editable && (
            <p className="text-sm text-ink-fade mt-1">
              Adicione livros aqui ou pela página de cada livro. Os do mês atual
              aparecem em Próximas leituras na home.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {withTargets.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[#6D3914] mb-2">
                Com meta
              </p>
              <ul className="space-y-3">
                {withTargets.map((b) => (
                  <BookCard
                    key={b.book_id}
                    book={b}
                    plan={plan}
                    todayISO={todayISO}
                    monthISO={monthISO}
                    editable={editable}
                    queueIndex={null}
                    queueLength={0}
                    onNewTarget={() => onNewTarget(b)}
                    onEditTarget={(t) => onEditTarget(b, t)}
                    onChanged={onChanged}
                  />
                ))}
              </ul>
            </div>
          )}

          {queue.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[#6D3914] mb-2">
                Fila de leitura{" "}
                <span className="normal-case tracking-normal text-ink-fade italic">
                  — na ordem em que você vai ler; usa a sobra da capacidade
                </span>
              </p>
              <ul className="space-y-3">
                {queue.map((b, i) => (
                  <BookCard
                    key={b.book_id}
                    book={b}
                    plan={plan}
                    todayISO={todayISO}
                    monthISO={monthISO}
                    editable={editable}
                    queueIndex={i}
                    queueLength={queue.length}
                    onNewTarget={() => onNewTarget(b)}
                    onEditTarget={() => {}}
                    onChanged={onChanged}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function BookCard({
  book,
  plan,
  todayISO,
  monthISO,
  editable,
  queueIndex,
  queueLength,
  onNewTarget,
  onEditTarget,
  onChanged,
}: {
  book: PlanBookInput;
  plan: ReturnType<typeof buildMonthPlan>;
  todayISO: string;
  monthISO: string;
  editable: boolean;
  /** Índice na fila (null = livro com meta). */
  queueIndex: number | null;
  queueLength: number;
  onNewTarget: () => void;
  onEditTarget: (target: TargetInput) => void;
  onChanged: () => void;
}) {
  const [, startTransition] = useTransition();
  const [metasOpen, setMetasOpen] = useState(false);
  const [daysOpen, setDaysOpen] = useState(false);
  const [editingPages, setEditingPages] = useState(false);
  const [pagesInput, setPagesInput] = useState("");
  const noPages = book.total_pages === null || book.total_pages <= 0;
  const remaining = Math.max(0, (book.total_pages ?? 0) - book.current_page);
  // Fila: quantas páginas planejei pra este mês (default = restante).
  const plannedThisMonth =
    book.pages_planned != null
      ? Math.min(remaining, book.pages_planned)
      : remaining;
  const pct =
    book.total_pages && book.total_pages > 0
      ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
      : 0;

  const stats: TargetStats[] = deriveBookTargets(
    book.targets,
    book.current_page,
    todayISO,
    book.pages_read_today,
  );

  // Resumo pro acordeon fechado: a meta "corrente" (primeira não concluída) e
  // a cota de hoje (fixa — não recalcula ao longo do dia).
  const currentStat = stats.find((s) => s.status !== "concluida") ?? null;
  const summaryChip = !currentStat
    ? { label: "todas cumpridas ✓", cls: "bg-moss/15 text-moss" }
    : currentStat.status === "vencida" && currentStat.target.carried_over
      ? { label: "não cumprida", cls: "bg-burgundy/15 text-burgundy" }
      : STATUS_CONFIG[currentStat.status];
  const activeStat =
    stats.find((s) => s.status === "em_dia" || s.status === "atrasada") ?? null;
  const todayDaily = activeStat?.todayQuota ?? 0;

  const proj = plan.queue.find((q) => q.book_id === book.book_id) ?? null;

  // Dias planejados deste livro de fila no mês visível (pro acordeon).
  const queueDays =
    queueIndex !== null
      ? plan.days.flatMap((d) =>
          d.entries
            .filter((e) => e.book_id === book.book_id && e.kind === "fila")
            .map((e) => ({ iso: d.iso, pages: e.pages })),
        )
      : [];

  // Livro de meta: fatia do mês = soma das contribuições diárias das metas
  // deste livro nos dias do mês visível.
  const metaMonthPages =
    queueIndex === null
      ? plan.days.reduce(
          (s, d) =>
            s +
            d.entries.reduce(
              (t, e) =>
                t + (e.book_id === book.book_id && e.kind === "meta"
                  ? e.pages
                  : 0),
              0,
            ),
          0,
        )
      : 0;
  // "Neste mês" = TODO o trecho lido/a ler no mês (não só o que falta).
  // A faixa vem do cronograma puro das metas (começa do zero, ignora a
  // página atual): posição no começo do mês → posição no fim do mês.
  const monthStartISO = isoForDay(plan.year, plan.month, 1);
  const monthEndISO = isoForDay(
    plan.year,
    plan.month,
    daysInMonth(plan.year, plan.month),
  );
  const currentMonthView = monthISO === `${todayISO.slice(0, 7)}-01`;
  // Página no INÍCIO do mês (fim do dia anterior) pelo cronograma.
  const metaFromBase = scheduledMetaPage(
    book.targets,
    0,
    addDaysISO(monthStartISO, -1),
  );
  // Página no FIM do mês: no mês atual usa o real (página atual + o que falta
  // ler no mês); nos outros, o cronograma.
  const metaToPage = currentMonthView
    ? book.current_page + metaMonthPages
    : scheduledMetaPage(book.targets, 0, monthEndISO);
  const metaMonthTotal = Math.max(0, metaToPage - metaFromBase);

  const handleRemoveBook = async () => {
    const res = await removeHomeNextRead(book.book_id, monthISO);
    if (res.ok) onChanged();
  };

  const handleDeleteTarget = async (id: string) => {
    const res = await deleteReadingTarget(id);
    if (res.ok) onChanged();
  };

  const handleCarryOver = (id: string, carried: boolean) => {
    startTransition(async () => {
      const res = await carryOverReadingTarget(id, carried);
      if (res.ok) onChanged();
    });
  };

  const handleReplan = (id: string, reset: boolean) => {
    startTransition(async () => {
      const res = await replanReadingTarget(id, reset);
      if (res.ok) onChanged();
    });
  };

  const handleMove = async (direction: "up" | "down") => {
    const res = await moveNextRead(book.book_id, direction, monthISO);
    if (res.ok) onChanged();
  };

  const handleSavePages = (pages: number | null) => {
    startTransition(async () => {
      const res = await setPlanBookPages(book.book_id, monthISO, pages);
      if (res.ok) {
        setEditingPages(false);
        onChanged();
      }
    });
  };

  return (
    <li className="rounded-lg border border-border bg-ivory-light p-4">
      <div className="flex gap-3">
        {/* Ordem na fila */}
        {queueIndex !== null && (
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0 justify-center">
            {editable ? (
              <>
                <IconActionButton
                  icon={<ChevronUpIcon className="w-4 h-4" />}
                  onClick={() => handleMove("up")}
                  disabled={queueIndex === 0}
                  label="Subir na fila"
                  className="p-0.5 text-ink-fade hover:text-ink-deep disabled:opacity-30"
                  activeColorClass="!text-[#6D3914]"
                />
                <span className="font-display text-lg text-[#6D3914] leading-none">
                  {queueIndex + 1}º
                </span>
                <IconActionButton
                  icon={<ChevronDownIcon className="w-4 h-4" />}
                  onClick={() => handleMove("down")}
                  disabled={queueIndex === queueLength - 1}
                  label="Descer na fila"
                  className="p-0.5 text-ink-fade hover:text-ink-deep disabled:opacity-30"
                  activeColorClass="!text-[#6D3914]"
                />
              </>
            ) : (
              <span className="font-display text-lg text-[#6D3914] leading-none">
                {queueIndex + 1}º
              </span>
            )}
          </div>
        )}

        <div className="w-12 h-[72px] flex-shrink-0 relative rounded overflow-hidden shadow-sm">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <BookCoverFallback
              title={book.title}
              size="sm"
              className="w-full h-full"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/book/${book.slug}`}
              className="font-display text-base text-ink-deep leading-tight line-clamp-2 hover:text-[#6D3914] transition-colors"
            >
              {book.title}
            </Link>
            {editable && (
              <IconActionButton
                icon={<TrashIcon className="w-4 h-4" />}
                onClick={handleRemoveBook}
                label="Remover deste mês do plano"
                title="Remover deste mês do plano (não muda o status do livro)"
                className="flex-shrink-0 p-1 -m-1 text-ink-fade hover:text-burgundy"
                activeColorClass="!text-burgundy"
              />
            )}
          </div>

          {noPages ? (
            <p className="text-sm text-burgundy italic mt-1">
              sem nº de páginas cadastrado
            </p>
          ) : (
            <>
              <div className="mt-1.5 h-1 w-full rounded-full bg-paper-soft overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: book.color }}
                />
              </div>
              <p className="text-sm text-ink-soft mt-1">
                página {book.current_page} de {book.total_pages} ·{" "}
                <span className="text-ink-deep font-medium">
                  faltam {remaining}
                </span>{" "}
                · ~{formatReadingTime(remaining * SECONDS_PER_PAGE)}
              </p>
              {queueIndex === null && metaMonthTotal > 0 && (
                <p className="text-sm text-ink-soft mt-0.5">
                  neste mês:{" "}
                  <span className="font-medium text-[#6D3914]">
                    {metaMonthTotal} páginas
                  </span>{" "}
                  <span className="text-ink-fade">
                    (~{formatReadingTime(metaMonthTotal * SECONDS_PER_PAGE)})
                  </span>{" "}
                  ·{" "}
                  <span className="text-ink-deep">
                    p. {metaFromBase + 1}–{metaToPage}
                  </span>
                  {metaMonthPages > 0 && metaMonthPages < metaMonthTotal && (
                    <span className="text-ink-fade">
                      {" "}
                      · faltam {metaMonthPages}p
                    </span>
                  )}
                </p>
              )}
            </>
          )}

          {/* Projeção da fila (com capacidade ou pela média, em ordem) */}
          {queueIndex !== null && !noPages && proj && (
            <div className="text-sm mt-1.5">
              <p className="flex items-center gap-2 flex-wrap">
                {proj.startISO && proj.endISO && (
                  <span className="text-moss">
                    leitura prevista: {ddmm(proj.startISO)} →{" "}
                    {ddmm(proj.endISO)}
                  </span>
                )}
                {proj.startISO && !proj.endISO && (
                  <span className="text-[#6D3914]">
                    começa {ddmm(proj.startISO)} · não termina este mês (sobram{" "}
                    {proj.leftAtMonthEnd}p)
                  </span>
                )}
                {!proj.startISO && (
                  <span className="text-ink-fade italic">
                    sem espaço este mês — os livros acima já preenchem o mês
                  </span>
                )}
                {queueDays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDaysOpen((o) => !o)}
                    className="inline-flex items-center gap-0.5 text-xs text-ink-fade hover:text-ink-deep transition-colors"
                  >
                    por dia
                    <ChevronDownIcon
                      className={clsx(
                        "w-3.5 h-3.5 transition-transform",
                        daysOpen && "rotate-180",
                      )}
                    />
                  </button>
                )}
              </p>
              {daysOpen && queueDays.length > 0 && (
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {queueDays.map((d) => (
                    <li
                      key={d.iso}
                      className="rounded-md border border-border/60 bg-paper-soft px-1.5 py-0.5 text-xs text-ink-soft"
                    >
                      {ddmm(d.iso)} ·{" "}
                      <span className="font-medium text-ink-deep">
                        {d.pages}p
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Fila: páginas planejadas pra este mês (default = livro todo). */}
          {queueIndex !== null && !noPages && (
            <div className="mt-1.5 text-sm">
              {editingPages ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-ink-soft">vou ler</span>
                  <input
                    type="number"
                    min={1}
                    max={remaining}
                    value={pagesInput}
                    onChange={(e) => setPagesInput(e.target.value)}
                    className="w-20 rounded-md border border-border bg-ivory-light px-2 py-1 text-sm text-ink-deep focus:outline-none focus:border-[#6D3914]/50"
                    autoFocus
                  />
                  <span className="text-ink-soft">páginas neste mês</span>
                  <button
                    type="button"
                    onClick={() => {
                      const n = Number(pagesInput);
                      handleSavePages(
                        Number.isFinite(n) && n > 0 ? n : null,
                      );
                    }}
                    className="text-xs text-gold-deep hover:text-ink-deep transition-colors"
                  >
                    salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePages(null)}
                    className="text-xs text-ink-fade hover:text-ink-deep transition-colors"
                  >
                    livro todo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPages(false)}
                    className="text-xs text-ink-fade hover:text-ink-deep transition-colors"
                  >
                    cancelar
                  </button>
                </div>
              ) : (
                <p className="text-ink-soft">
                  neste mês:{" "}
                  <span className="font-medium text-ink-deep">
                    {plannedThisMonth} páginas
                  </span>
                  {book.pages_planned == null && (
                    <span className="text-ink-fade"> (livro todo)</span>
                  )}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => {
                        setPagesInput(
                          book.pages_planned != null
                            ? String(book.pages_planned)
                            : "",
                        );
                        setEditingPages(true);
                      }}
                      className="ml-2 text-xs text-gold-deep hover:text-ink-deep transition-colors"
                    >
                      editar
                    </button>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metas (acordeon) */}
      {!noPages && (stats.length > 0 || editable) && (
        <div className="mt-3 pt-3 border-t border-border/60">
          {stats.length === 0 ? (
            <button
              type="button"
              onClick={onNewTarget}
              className="text-sm text-gold-deep hover:text-ink-deep transition-colors inline-flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              Tem meta? Adicionar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMetasOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 text-sm text-ink-soft hover:text-ink-deep transition-colors"
                aria-expanded={metasOpen}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <FlagIcon className="w-4 h-4 text-[#6D3914] flex-shrink-0" />
                  <span>
                    {stats.length} {stats.length === 1 ? "meta" : "metas"}
                  </span>
                  <span
                    className={clsx(
                      "inline-block text-xs rounded-full px-2 py-0.5",
                      summaryChip.cls,
                    )}
                  >
                    {summaryChip.label}
                  </span>
                  {activeStat?.doneToday ? (
                    <span className="truncate text-moss">hoje cumprido ✓</span>
                  ) : (
                    todayDaily > 0 && (
                      <span className="truncate">
                        hoje:{" "}
                        <span className="font-medium text-[#6D3914]">
                          {Math.max(0, todayDaily - (activeStat?.readToday ?? 0))}
                          p
                        </span>
                      </span>
                    )
                  )}
                </span>
                <ChevronDownIcon
                  className={clsx(
                    "w-4 h-4 text-ink-fade flex-shrink-0 transition-transform",
                    metasOpen && "rotate-180",
                  )}
                />
              </button>
              {metasOpen && (
                <div className="mt-2">
                  <ul className="space-y-2 mb-2">
                    {stats.map((s, i) => (
                      <TargetRow
                        key={s.target.id}
                        stats={s}
                        hasNext={i < stats.length - 1}
                        editable={editable}
                        onEdit={() => onEditTarget(s.target)}
                        onDelete={() => handleDeleteTarget(s.target.id)}
                        onCarryOver={(carried) =>
                          handleCarryOver(s.target.id, carried)
                        }
                        onReplan={() => handleReplan(s.target.id, false)}
                        onResetReplan={() => handleReplan(s.target.id, true)}
                      />
                    ))}
                  </ul>
                  {editable && (
                    <button
                      type="button"
                      onClick={onNewTarget}
                      className="text-sm text-gold-deep hover:text-ink-deep transition-colors inline-flex items-center gap-1"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Nova meta
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

const STATUS_CONFIG: Record<
  TargetStats["status"],
  { label: string; cls: string }
> = {
  concluida: { label: "concluída ✓", cls: "bg-moss/15 text-moss" },
  em_dia: { label: "em dia", cls: "bg-moss/15 text-moss" },
  atrasada: { label: "atrasada", cls: "bg-burgundy/15 text-burgundy" },
  vencida: { label: "vencida", cls: "bg-burgundy/15 text-burgundy" },
  futura: { label: "futura", cls: "bg-paper-soft text-ink-fade" },
};

/** Valor rotulado (rótulo pequeno em cima, número em destaque) — escaneável. */
function MetaStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "accent" | "moss" | "burgundy";
}) {
  const color =
    tone === "accent"
      ? "text-[#6D3914]"
      : tone === "moss"
        ? "text-moss"
        : tone === "burgundy"
          ? "text-burgundy"
          : "text-ink-deep";
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-ink-fade leading-none mb-1">
        {label}
      </div>
      <div className={clsx("text-sm font-semibold leading-none", color)}>
        {value}
      </div>
    </div>
  );
}

function TargetRow({
  stats,
  hasNext,
  editable,
  onEdit,
  onDelete,
  onCarryOver,
  onReplan,
  onResetReplan,
}: {
  stats: TargetStats;
  /** Existe meta seguinte neste livro (pra receber o restante da vencida). */
  hasNext: boolean;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCarryOver: (carried: boolean) => void;
  /** Redistribui o atraso nos dias restantes (só com backlog). */
  onReplan: () => void;
  onResetReplan: () => void;
}) {
  const t = stats.target;
  const carried = stats.status === "vencida" && t.carried_over;
  const cfg = carried
    ? { label: "não cumprida", cls: "bg-burgundy/15 text-burgundy" }
    : STATUS_CONFIG[stats.status];
  const active = stats.status === "em_dia" || stats.status === "atrasada";
  const daysLabel = `${stats.remainingDays} ${
    stats.remainingDays === 1 ? "dia" : "dias"
  }`;

  return (
    <li className="rounded-lg border border-border bg-paper-soft/40 px-3 py-2.5">
      {/* Cabeçalho: faixa de páginas + status + ações */}
      <div className="flex items-center gap-2">
        <FlagIcon className="w-4 h-4 text-[#6D3914] flex-shrink-0" />
        <span className="font-display text-base text-ink-deep whitespace-nowrap leading-none">
          p. {t.page_from}–{t.page_to}
        </span>
        <span
          className={clsx(
            "text-[11px] rounded-full px-2 py-0.5 leading-none",
            cfg.cls,
          )}
        >
          {cfg.label}
        </span>
        {editable && (
          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            <IconActionButton
              icon={<PencilSquareIcon className="w-4 h-4" />}
              onClick={onEdit}
              label="Editar meta"
              className="p-1 text-ink-fade hover:text-ink-deep"
              activeColorClass="!text-ink-deep"
            />
            <IconActionButton
              icon={<TrashIcon className="w-4 h-4" />}
              onClick={onDelete}
              label="Remover meta"
              className="p-1 text-ink-fade hover:text-burgundy"
              activeColorClass="!text-burgundy"
            />
          </div>
        )}
      </div>

      {/* Período + total + ritmo (o "pág/dia" fica visível mesmo depois de
          iniciar a meta — antes só aparecia nas não iniciadas). */}
      <p className="text-xs text-ink-fade mt-1 ml-6">
        {ddmm(t.start_date)} – {ddmm(t.end_date)} · {stats.totalPages} páginas
        {active && ` · ${stats.originalDaily} pág/dia`}
      </p>

      {/* Corpo por status — números rotulados, escaneáveis */}
      <div className="ml-6 mt-2">
        {stats.status === "concluida" && (
          <span className="text-sm text-moss font-medium">✓ meta cumprida</span>
        )}

        {stats.status === "futura" && (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <MetaStat
              label="ritmo"
              value={`${stats.originalDaily} pág/dia`}
              tone="accent"
            />
            <MetaStat label="período" value={daysLabel} />
          </div>
        )}

        {active &&
          (stats.doneToday ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-sm text-moss font-medium">
                ✓ hoje cumprido · leu {stats.readToday}p
                {stats.aheadToday > 0 && ` (+${stats.aheadToday} adiantada)`}
              </span>
              <MetaStat label="faltam" value={`${stats.remainingPages} pág`} />
              <MetaStat label="prazo" value={daysLabel} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <MetaStat
                label="hoje"
                value={`${Math.max(
                  0,
                  (stats.todayQuota ?? 0) - stats.readToday,
                )} pág`}
                tone="accent"
              />
              {stats.targetPageToday !== null && (
                <MetaStat label="até" value={`p. ${stats.targetPageToday}`} />
              )}
              <MetaStat label="faltam" value={`${stats.remainingPages} pág`} />
              <MetaStat label="prazo" value={daysLabel} />
            </div>
          ))}

        {stats.status === "vencida" && !carried && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-sm text-burgundy font-medium">
              ⚠ faltaram {stats.remainingPages} páginas
            </span>
            {editable && hasNext && stats.remainingPages > 0 && (
              <button
                type="button"
                onClick={() => onCarryOver(true)}
                className="inline-flex items-center gap-1 text-sm text-gold-deep hover:text-ink-deep transition-colors"
              >
                <ArrowUturnRightIcon className="w-3.5 h-3.5" />
                jogar na próxima meta
              </button>
            )}
          </div>
        )}

        {carried && (
          <span className="text-sm text-ink-soft">
            não cumprida —{" "}
            <span className="font-medium text-ink-deep">
              {stats.remainingPages}p
            </span>{" "}
            somadas na meta seguinte{" "}
            <button
              type="button"
              onClick={() => onCarryOver(false)}
              className="text-xs text-ink-fade underline underline-offset-2 hover:text-ink-deep transition-colors"
            >
              desfazer
            </button>
          </span>
        )}

        {/* Atraso acumulado + recalcular */}
        {stats.backlog > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-burgundy">
              ⚠ atrasado: {stats.backlog}p de dias anteriores
            </span>
            {editable && (
              <button
                type="button"
                onClick={onReplan}
                className="inline-flex items-center gap-1 text-xs text-gold-deep hover:text-ink-deep transition-colors underline underline-offset-2"
              >
                <ArrowUturnRightIcon className="w-3.5 h-3.5" />
                recalcular nos dias restantes
              </button>
            )}
          </div>
        )}

        {/* Marca de recálculo manual */}
        {stats.target.replan_from_date && (
          <p className="text-[11px] text-ink-fade italic mt-1.5">
            recalculada em {ddmm(stats.target.replan_from_date)}
            {editable && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={onResetReplan}
                  className="underline underline-offset-2 hover:text-ink-deep transition-colors"
                >
                  voltar ao original
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </li>
  );
}

// ============================================================================
// Calendário — só visualização
// ============================================================================
function CalendarSection({
  plan,
  todayISO,
}: {
  plan: ReturnType<typeof buildMonthPlan>;
  todayISO: string;
}) {
  const firstWeekday = new Date(
    Date.UTC(plan.year, plan.month - 1, 1),
  ).getUTCDay();
  const blanks = Array.from({ length: firstWeekday });

  return (
    <section className="mt-8">
      <h2 className="text-sm uppercase tracking-wider text-ink-fade mb-3">
        Calendário{" "}
        <span className="normal-case tracking-normal text-ink-fade/80 italic">
          — visualização do plano (🚩 = prazo de meta)
        </span>
      </h2>

      {/* Desktop: grade */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-xs uppercase tracking-wider text-ink-fade text-center pb-1"
          >
            {w}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {plan.days.map((d) => {
          const isToday = d.iso === todayISO;
          const total = d.entries.reduce((s, e) => s + e.pages, 0);
          return (
            <div
              key={d.iso}
              className={clsx(
                "min-h-[110px] rounded-md border p-2 flex flex-col gap-1",
                isToday
                  ? "border-[#6D3914] bg-[#6D3914]/[0.04]"
                  : "border-border bg-ivory-light",
                d.isPast && "opacity-45",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    "text-sm font-medium",
                    isToday ? "text-[#6D3914]" : "text-ink-fade",
                  )}
                >
                  {d.day}
                </span>
                {d.deadlines.length > 0 && (
                  <span title={`Prazo: ${d.deadlines.join(", ")}`}>
                    <FlagIcon className="w-3.5 h-3.5 text-burgundy" />
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                {d.entries.map((e) => (
                  <span
                    key={`${e.book_id}-${e.kind}`}
                    className="text-[11px] leading-tight rounded px-1.5 py-1 text-ivory truncate"
                    style={{ backgroundColor: e.color }}
                    title={`${e.title} · ${e.pages} pág (${e.kind})`}
                  >
                    {e.pages}p · {e.title}
                  </span>
                ))}
              </div>
              {total > 0 && (
                <p className="text-[10px] text-ink-fade text-right italic">
                  {total}p · ~{formatReadingTime(total * SECONDS_PER_PAGE)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: lista dos dias com leitura */}
      <ul className="md:hidden space-y-2">
        {plan.days
          .filter((d) => !d.isPast && (d.entries.length > 0 || d.deadlines.length > 0))
          .map((d) => {
            const isToday = d.iso === todayISO;
            const weekday = new Date(`${d.iso}T00:00:00Z`).getUTCDay();
            return (
              <li
                key={d.iso}
                className={clsx(
                  "rounded-md border p-2.5",
                  isToday
                    ? "border-[#6D3914] bg-[#6D3914]/[0.04]"
                    : "border-border bg-ivory-light",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={clsx(
                      "text-sm font-medium",
                      isToday ? "text-[#6D3914]" : "text-ink-deep",
                    )}
                  >
                    {WEEKDAYS[weekday]} {d.day}
                    {isToday && " · hoje"}
                  </span>
                  {d.deadlines.length > 0 && (
                    <span className="text-xs text-burgundy inline-flex items-center gap-1">
                      <FlagIcon className="w-3.5 h-3.5" />
                      prazo: {d.deadlines.join(", ")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {d.entries.map((e) => (
                    <span
                      key={`${e.book_id}-${e.kind}`}
                      className="text-sm rounded px-2 py-1 text-ivory flex items-center justify-between gap-2"
                      style={{ backgroundColor: e.color }}
                    >
                      <span className="truncate">{e.title}</span>
                      <span className="flex-shrink-0 tabular-nums">
                        {e.pages}p
                      </span>
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
      </ul>
    </section>
  );
}

// ============================================================================
// Modal de meta
// ============================================================================
function TargetModal({
  book,
  target,
  todayISO,
  onClose,
  onSaved,
}: {
  book: PlanBookInput;
  target: TargetInput | null;
  todayISO: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Página inicial sugerida: fim da última meta + 1, ou página atual + 1.
  const lastTo = book.targets.reduce((max, t) => Math.max(max, t.page_to), 0);
  const suggestedFrom = Math.max(lastTo, book.current_page) + 1;

  const [startDate, setStartDate] = useState(target?.start_date ?? todayISO);
  const [endDate, setEndDate] = useState(target?.end_date ?? "");
  const [pageFrom, setPageFrom] = useState(
    target ? String(target.page_from) : String(suggestedFrom),
  );
  const [pageTo, setPageTo] = useState(target ? String(target.page_to) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Derivação ao vivo: total e páginas/dia.
  const from = Number(pageFrom);
  const to = Number(pageTo);
  const totalPages =
    Number.isFinite(from) && Number.isFinite(to) && to >= from
      ? to - from + 1
      : null;
  const days =
    startDate && endDate && endDate >= startDate
      ? inclusiveDays(startDate, endDate)
      : null;
  const daily =
    totalPages !== null && days !== null ? Math.ceil(totalPages / days) : null;

  const submit = () => {
    setError(null);
    const input: ReadingTargetInput = {
      id: target?.id,
      book_id: book.book_id,
      start_date: startDate,
      end_date: endDate,
      page_from: from,
      page_to: to,
    };
    startTransition(async () => {
      const res = await upsertReadingTarget(input);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onSaved();
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={target ? `Editar meta · ${book.title}` : `Nova meta · ${book.title}`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-fade mb-1">Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-fade mb-1">Prazo</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-fade mb-1">
              Da página
            </label>
            <input
              type="number"
              min={1}
              value={pageFrom}
              onChange={(e) => setPageFrom(e.target.value)}
              className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-fade mb-1">
              Até a página
            </label>
            <input
              type="number"
              min={from || 1}
              max={book.total_pages ?? undefined}
              value={pageTo}
              onChange={(e) => setPageTo(e.target.value)}
              placeholder={book.total_pages ? String(book.total_pages) : ""}
              className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
            />
          </div>
        </div>

        {/* Derivação ao vivo */}
        {totalPages !== null && (
          <div className="rounded-md bg-paper-soft border border-border px-3 py-2 text-sm text-ink-soft">
            <span className="font-medium text-ink-deep">{totalPages} páginas</span>
            {days !== null && daily !== null && (
              <>
                {" "}
                em {days} {days === 1 ? "dia" : "dias"} →{" "}
                <span className="font-medium text-[#6D3914]">
                  {daily} pág/dia
                </span>{" "}
                (~{formatReadingTime(daily * SECONDS_PER_PAGE)}/dia)
              </>
            )}
          </div>
        )}

        {book.total_pages && (
          <p className="text-xs text-ink-fade">
            O livro tem {book.total_pages} páginas · você está na{" "}
            {book.current_page}.
          </p>
        )}

        {error && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={submit}
            loading={pending}
            disabled={!endDate || !pageFrom || !pageTo}
          >
            {target ? "Salvar meta" : "Criar meta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Modal de capacidade
// ============================================================================
function CapacityModal({
  period,
  year,
  month,
  todayISO,
  onClose,
  onSaved,
}: {
  period: CapacityPeriod | null;
  year: number;
  month: number;
  todayISO: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const monthStart = isoForDay(year, month, 1);
  const monthEnd = isoForDay(year, month, daysInMonth(year, month));
  // Novo período nasce dentro do mês visado: do início do mês (ou de hoje, se
  // for o mês atual) até o fim do mês.
  const defaultStart = todayISO > monthStart ? todayISO : monthStart;
  const [startDate, setStartDate] = useState(
    period?.start_date ?? defaultStart,
  );
  const [endDate, setEndDate] = useState(period?.end_date ?? monthEnd);
  const [pages, setPages] = useState(
    period ? String(period.pages_per_day) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const n = Number(pages);
  const days =
    startDate && endDate && endDate >= startDate
      ? inclusiveDays(startDate, endDate)
      : null;
  const totalCovered =
    days !== null && Number.isFinite(n) && n > 0 ? days * n : null;

  const submit = () => {
    setError(null);
    const input: ReadingCapacityInput = {
      id: period?.id,
      start_date: startDate,
      end_date: endDate,
      pages_per_day: n,
    };
    startTransition(async () => {
      const res = await upsertReadingCapacity(input);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onSaved();
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={period ? "Editar capacidade" : "Minha capacidade"}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-fade">
          Quantas páginas por dia você consegue ler nesse período? Períodos mais
          curtos (ex.: semana de folga) valem por cima do período geral.
        </p>

        <div>
          <label className="block text-xs text-ink-fade mb-1">
            Páginas por dia
          </label>
          <input
            type="number"
            min={1}
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            autoFocus
            placeholder="Ex.: 100"
            className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-fade mb-1">De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-fade mb-1">Até</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-border bg-paper-soft px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
            />
          </div>
        </div>

        {totalCovered !== null && (
          <p className="rounded-md bg-paper-soft border border-border px-3 py-2 text-sm text-ink-soft">
            {days} {days === 1 ? "dia" : "dias"} ×{" "}
            <span className="font-medium text-ink-deep">{n} pág</span> ={" "}
            <span className="font-medium text-[#6D3914]">
              {totalCovered.toLocaleString("pt-BR")} páginas
            </span>{" "}
            no período (~{formatReadingTime(n * SECONDS_PER_PAGE)}/dia)
          </p>
        )}

        {error && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={submit}
            loading={pending}
            disabled={!pages || !startDate || !endDate}
          >
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Modal de adicionar livro (grava em home_next_read — mesma lista da home)
// ============================================================================
function AddBookModal({
  existingIds,
  monthISO,
  onClose,
  onAdded,
}: {
  existingIds: Set<string>;
  monthISO: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/books/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        const json = (await res.json()) as { books?: BookSearchOption[] };
        setResults(json.books ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleAdd = async (book: BookSearchOption) => {
    setAdding(true);
    const res = await addHomeNextRead(book.id, monthISO);
    setAdding(false);
    if (res.ok) onAdded();
  };

  const filtered = results.filter((b) => !existingIds.has(b.id));

  return (
    <Modal open onClose={onClose} title="Adicionar livro ao plano" size="sm">
      <div className="space-y-3">
        <p className="text-sm text-ink-fade">
          O livro também entra em Próximas leituras na home — é a mesma lista.
        </p>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-fade" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar livro pelo título…"
            className="w-full rounded-md bg-paper-soft text-ink-deep placeholder:text-ink-fade border border-border focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 pl-9 pr-3 py-2 text-sm outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-fade hover:text-ink-deep"
              aria-label="Limpar"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <ul className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-paper-soft">
          {loading && filtered.length === 0 && (
            <li className="py-3 text-sm italic text-ink-fade text-center">
              Buscando…
            </li>
          )}
          {!loading && filtered.length === 0 && (
            <li className="py-3 text-sm italic text-ink-fade text-center">
              {query.trim() ? "Nenhum livro encontrado." : "Comece digitando…"}
            </li>
          )}
          {filtered.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => handleAdd(b)}
                disabled={adding}
                className="w-full text-left px-2 py-2 text-sm text-ink-deep hover:bg-paper-soft transition-colors rounded disabled:opacity-50"
              >
                {b.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
