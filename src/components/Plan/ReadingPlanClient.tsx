"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  ClockIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { BookCoverFallback } from "@/components/ui";
import {
  buildPlanSummary,
  deriveSchedule,
  formatReadingTime,
  monthNamePT,
  SECONDS_PER_PAGE,
  type DayCell,
} from "@/utils/readingPlan";
import type { ReadingPlanData, PlanBookRow } from "@/services/readingPlanData";
import { upsertPlanBookSchedule } from "@/actions/upsertPlanBookSchedule";
import { removePlanBook } from "@/actions/removePlanBook";
import { replanFromToday } from "@/actions/replanFromToday";
import DayLogModal from "./DayLogModal";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function ddmm(iso: string | null): string {
  if (!iso) return "—";
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

type Props = {
  data: ReadingPlanData;
  todayISO: string;
};

export default function ReadingPlanClient({ data, todayISO }: Props) {
  const { year, month, isCurrentMonth, availableMonths } = data;
  const [books, setBooks] = useState<PlanBookRow[]>(data.books);
  const prevBooksRef = useRef<PlanBookRow[]>(data.books);

  const summary = useMemo(
    () => buildPlanSummary(year, month, books, todayISO),
    [year, month, books, todayISO],
  );

  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dayModalCell, setDayModalCell] = useState<DayCell | null>(null);

  // Atualiza o real local (otimista) quando registra leitura de um dia.
  const patchActual = (bookId: string, iso: string, pages: number) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.book_id !== bookId) return b;
        const next = { ...(b.actualByDay ?? {}) };
        if (pages > 0) next[iso] = pages;
        else delete next[iso];
        return { ...b, actualByDay: next };
      }),
    );
  };

  // Atualiza o planejado local (override) quando salva o plano de um dia.
  // pages < 0 = override removido (volta pro ritmo uniforme).
  const patchOverride = (bookId: string, iso: string, pages: number) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.book_id !== bookId) return b;
        const next = { ...(b.overrides ?? {}) };
        if (pages < 0) delete next[iso];
        else next[iso] = pages;
        return { ...b, overrides: next };
      }),
    );
  };

  const handleReplan = () => {
    startTransition(async () => {
      const result = await replanFromToday(year, month);
      if (result.ok) router.refresh();
    });
  };

  const patchBook = (bookId: string, patch: Partial<PlanBookRow>) => {
    prevBooksRef.current = books;
    setBooks((prev) =>
      prev.map((b) => {
        if (b.book_id !== bookId) return b;
        const next = { ...b, ...patch };
        // `pages` (efetivo do mês) = campo do usuário, senão o restante real.
        // Recalcula na hora pra a meta/total reagir sem recarregar a página.
        if ("pages_this_month" in patch) {
          next.pages =
            patch.pages_this_month != null
              ? patch.pages_this_month
              : (b.remaining ?? null);
        }
        return next;
      }),
    );
    startTransition(async () => {
      const target = books.find((b) => b.book_id === bookId);
      const merged = { ...target, ...patch } as PlanBookRow;
      const result = await upsertPlanBookSchedule({
        year,
        month,
        book_id: bookId,
        start_date: merged.start_date,
        pages_per_day: merged.pages_per_day,
        end_date: merged.end_date,
        pages_this_month: merged.pages_this_month,
      });
      if (!result.ok) setBooks(prevBooksRef.current);
    });
  };

  const handleRemove = (bookId: string) => {
    prevBooksRef.current = books;
    setBooks((prev) => prev.filter((b) => b.book_id !== bookId));
    startTransition(async () => {
      const result = await removePlanBook(year, month, bookId);
      if (!result.ok) setBooks(prevBooksRef.current);
      else router.refresh();
    });
  };

  return (
    <div className="font-body">
      <PlanHeader
        year={year}
        month={month}
        isCurrentMonth={isCurrentMonth}
        availableMonths={availableMonths}
      />

      <StatsRow summary={summary} isCurrentMonth={isCurrentMonth} />

      {books.length > 0 && (
        <BalanceBanner summary={summary} todayISO={todayISO} />
      )}

      {books.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-paper p-8 text-center">
          <p className="font-display italic text-ink-soft">
            Nenhum livro no plano deste mês.
          </p>
          <p className="text-sm text-ink-fade mt-1">
            Adicione livros em{" "}
            <Link href="/" className="text-[#6D3914] hover:underline">
              Próximas leituras
            </Link>{" "}
            na home — eles aparecem aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          {/* Visão rápida — resumo do planejamento sem precisar clicar */}
          <PlanOverview books={books} />

          {/* Calendário — largura total */}
          <section className="mt-8">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h2 className="text-sm uppercase tracking-wider text-ink-fade">
                Calendário · {monthNamePT(month)} {year}
                {isCurrentMonth && (
                  <span className="ml-2 normal-case tracking-normal text-ink-fade/80 italic">
                    clique num dia pra planejar e registrar
                  </span>
                )}
              </h2>
              {isCurrentMonth && summary.balance < 0 && (
                <button
                  type="button"
                  onClick={handleReplan}
                  className="text-sm px-2.5 py-1 rounded-md border border-[#6D3914]/40 bg-[#6D3914]/10 text-[#6D3914] hover:bg-[#6D3914]/15 transition-colors"
                  title="Zera o déficit: redistribui o que falta pelos dias restantes"
                >
                  Re-planejar a partir de hoje
                </button>
              )}
            </div>
            <MonthCalendar
              summary={summary}
              todayISO={todayISO}
              onDayClick={isCurrentMonth ? setDayModalCell : undefined}
              className="hidden md:block"
            />
            <MonthAgenda
              summary={summary}
              todayISO={todayISO}
              onDayClick={isCurrentMonth ? setDayModalCell : undefined}
              className="md:hidden"
            />
          </section>

          {/* Livros — cards maiores, 2–3 por linha */}
          <section className="mt-8">
            <h2 className="text-sm uppercase tracking-wider text-ink-fade mb-3">
              Livros do mês · ritmo de cada um
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {books.map((b) => (
                <PlanBookCard
                  key={b.book_id}
                  book={b}
                  readOnly={!isCurrentMonth}
                  monthPrefix={`${year}-${String(month).padStart(2, "0")}`}
                  onPatch={(patch) => patchBook(b.book_id, patch)}
                  onRemove={() => handleRemove(b.book_id)}
                />
              ))}
            </ul>
          </section>
        </>
      )}

      {dayModalCell && (
        <DayLogModal
          cell={dayModalCell}
          books={books}
          year={year}
          month={month}
          dailyTarget={summary.dailyTarget}
          onClose={() => {
            setDayModalCell(null);
            router.refresh();
          }}
          onSavedPlan={patchOverride}
          onSavedActual={patchActual}
        />
      )}
    </div>
  );
}

// ============================================================================
// Header + seletor de mês
// ============================================================================
function PlanHeader({
  year,
  month,
  isCurrentMonth,
  availableMonths,
}: {
  year: number;
  month: number;
  isCurrentMonth: boolean;
  availableMonths: { year: number; month: number }[];
}) {
  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;
  const nextM = month === 12 ? 1 : month + 1;
  const nextY = month === 12 ? year + 1 : year;

  return (
    <header className="pb-4 border-b border-border">
      <p className="font-body text-sm uppercase tracking-[0.25em] text-ink-fade">
        Plano de leitura
      </p>
      <div className="flex items-center justify-between gap-4 mt-1 flex-wrap">
        <h1 className="font-display text-3xl md:text-4xl text-ink-deep leading-tight">
          {monthNamePT(month)} {year}
          {isCurrentMonth && (
            <span className="ml-2 align-middle text-sm not-italic font-body uppercase tracking-wider text-[#6D3914] bg-[#6D3914]/10 border border-[#6D3914]/30 rounded-full px-2 py-0.5">
              mês atual
            </span>
          )}
        </h1>
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Trocar mês">
          <Link
            href={`/plano?year=${prevY}&month=${prevM}`}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-ivory-light px-2.5 py-1.5 text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Link>
          {!isCurrentMonth && (
            <Link
              href="/plano"
              className="inline-flex items-center rounded-md border border-[#6D3914]/40 bg-[#6D3914]/10 text-[#6D3914] px-2.5 py-1.5 hover:bg-[#6D3914]/15 transition-colors"
            >
              Hoje
            </Link>
          )}
          <Link
            href={`/plano?year=${nextY}&month=${nextM}`}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-ivory-light px-2.5 py-1.5 text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </nav>
      </div>
      {availableMonths.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {availableMonths.map((m) => {
            const active = m.year === year && m.month === month;
            return (
              <Link
                key={`${m.year}-${m.month}`}
                href={`/plano?year=${m.year}&month=${m.month}`}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "text-sm px-2.5 py-1 rounded-md border transition-colors",
                  active
                    ? "bg-[#6D3914]/15 text-[#6D3914] border-[#6D3914]/40 cursor-default pointer-events-none"
                    : "bg-paper-soft text-ink-soft border-border hover:border-roasted-chestnut hover:text-ink-deep",
                )}
              >
                {monthNamePT(m.month).slice(0, 3)}/{String(m.year).slice(2)}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

// ============================================================================
// Faixa de estatísticas
// ============================================================================
function StatsRow({
  summary,
  isCurrentMonth,
}: {
  summary: ReturnType<typeof buildPlanSummary>;
  isCurrentMonth: boolean;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={<BookOpenIcon className="w-5 h-5" />}
        label="Livros no plano"
        value={String(summary.totalBooks)}
        hint={
          summary.booksWithoutPages > 0
            ? `${summary.booksWithoutPages} sem nº de páginas`
            : `${summary.scheduledBooks} agendados`
        }
        warn={summary.booksWithoutPages > 0}
      />
      <StatCard
        icon={<DocumentTextIcon className="w-5 h-5" />}
        label="Páginas a ler"
        value={summary.totalPages.toLocaleString("pt-BR")}
        hint="desconta o que já leu"
      />
      <StatCard
        icon={<span className="font-display text-lg leading-none">÷</span>}
        label={isCurrentMonth ? "Meta por dia" : "Média por dia"}
        value={`${summary.dailyTarget.toLocaleString("pt-BR")} pág`}
        subValue={`≈ ${formatReadingTime(summary.dailyTarget * SECONDS_PER_PAGE)}`}
        hint={
          isCurrentMonth
            ? `faltam ${summary.remainingDays} ${summary.remainingDays === 1 ? "dia" : "dias"}`
            : `${summary.daysInMonth} dias`
        }
      />
      <StatCard
        icon={<ClockIcon className="w-5 h-5" />}
        label="Tempo total"
        value={formatReadingTime(summary.totalSeconds)}
        hint="pior caso · 1m20/pág"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  hint,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-ivory-light p-3">
      <div className="flex items-center gap-1.5 text-ink-fade">
        <span className="text-[#6D3914]">{icon}</span>
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-2xl text-ink-deep mt-1 leading-none">
        {value}
      </p>
      {subValue && (
        <p className="font-display text-base text-[#6D3914] mt-0.5 leading-none">
          {subValue}
        </p>
      )}
      {hint && (
        <p
          className={clsx(
            "text-xs mt-1 italic",
            warn ? "text-burgundy" : "text-ink-fade",
          )}
        >
          {warn && (
            <ExclamationTriangleIcon className="w-3 h-3 inline mr-0.5 -mt-0.5" />
          )}
          {hint}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Visão rápida do planejamento — tabela compacta, sem precisar clicar
// ============================================================================
function PlanOverview({ books }: { books: PlanBookRow[] }) {
  const rows = books
    .map((b) => ({ book: b, schedule: deriveSchedule(b) }))
    .filter((r) => r.schedule !== null);
  if (rows.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-sm uppercase tracking-wider text-ink-fade mb-3">
        Resumo do planejamento
      </h2>
      <div className="rounded-lg border border-border bg-ivory-light overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-ink-fade border-b border-border">
              <th className="text-left font-normal px-3 py-2">Livro</th>
              <th className="text-left font-normal px-3 py-2">Período</th>
              <th className="text-right font-normal px-3 py-2">Ritmo</th>
              <th className="text-right font-normal px-3 py-2">Progresso</th>
              <th className="text-right font-normal px-3 py-2">Falta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ book, schedule }) => {
              const s = schedule!;
              const read = book.pages_read;
              const total = book.total_pages ?? 0;
              const pct =
                total > 0 ? Math.min(100, Math.round((read / total) * 100)) : 0;
              return (
                <tr
                  key={book.book_id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: book.color }}
                        aria-hidden
                      />
                      <span className="text-ink-deep truncate max-w-[180px]">
                        {book.title}
                      </span>
                      {book.is_continuation && (
                        <span className="text-[11px] text-[#6D3914] italic flex-shrink-0">
                          (continuação)
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-ink-soft whitespace-nowrap">
                    {ddmm(s.start_date)} → {ddmm(s.end_date)}
                  </td>
                  <td className="px-3 py-2 text-right text-ink-soft whitespace-nowrap">
                    {s.pages_per_day}p/dia
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-12 h-1 rounded-full bg-paper-soft overflow-hidden">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: book.color,
                          }}
                        />
                      </span>
                      <span className="text-ink-fade text-sm">{pct}%</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-ink-deep font-medium whitespace-nowrap">
                    {book.pages ?? 0}p
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================================================
// Banner de saldo (plano × real, cumulativo até hoje)
// ============================================================================
function BalanceBanner({
  summary,
  todayISO,
}: {
  summary: ReturnType<typeof buildPlanSummary>;
  todayISO: string;
}) {
  const { totalPages, actualToDate, dailyTarget, daysInMonth } = summary;
  const elapsedDays = summary.cells.filter((c) => c.isPast).length;

  // Saldo principal — VISÃO DO TODO: pra ler todos os livros no mês num ritmo
  // constante, quanto você já deveria ter lido até hoje, contra o que leu.
  // Restante no início do mês = restante agora + lido no mês (estável).
  const monthStartTotal = totalPages + actualToDate;
  const steadyDaily = daysInMonth > 0 ? monthStartTotal / daysInMonth : 0;
  const shouldHaveRead = Math.round(steadyDaily * elapsedDays);
  const metaBalance = actualToDate - shouldHaveRead; // <0 atrasada
  const behind = metaBalance < 0;
  const onTrack = metaBalance === 0;
  const absMeta = Math.abs(metaBalance);

  // Ritmo real médio (pág/dia) × meta/dia (pra terminar tudo no prazo).
  const actualAvg = elapsedDays > 0 ? Math.round(actualToDate / elapsedDays) : 0;
  const planBalance = metaBalance;

  // Hoje: meta × planejado × lido.
  const todayCell = summary.cells.find((c) => c.iso === todayISO);
  const todayPlanned = todayCell?.planned ?? 0;
  const todayActual = todayCell?.actual ?? 0;
  const todayLeft = dailyTarget - todayActual;

  // Sugestão de reajuste vs meta.
  const extraPerDay =
    behind && summary.remainingDays > 0
      ? Math.ceil(absMeta / summary.remainingDays)
      : 0;

  return (
    <div
      className={clsx(
        "mt-4 rounded-lg border p-4",
        onTrack
          ? "border-moss/40 bg-moss/[0.06]"
          : behind
            ? "border-burgundy/40 bg-burgundy/[0.06]"
            : "border-[#6D3914]/40 bg-[#6D3914]/[0.06]",
      )}
    >
      <p className="text-xs uppercase tracking-wider text-ink-fade">
        Saldo até hoje
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1.5">
        {/* Bloco 1 — vs meta (o principal) */}
        <div>
          <p
            className={clsx(
              "font-display text-2xl leading-tight",
              onTrack ? "text-moss" : behind ? "text-burgundy" : "text-[#6D3914]",
            )}
          >
            {onTrack && "Em dia ✓"}
            {!onTrack && !behind && `Adiantada · +${absMeta}`}
            {behind && `Atrasada · −${absMeta} pág`}
          </p>
          <p className="text-sm text-ink-fade mt-0.5">
            devia ter lido {shouldHaveRead} · leu {actualToDate} (de{" "}
            {totalPages.toLocaleString("pt-BR")} no mês)
          </p>
          <p className="text-sm text-ink-fade">
            seu ritmo:{" "}
            <span
              className={
                actualAvg >= dailyTarget ? "text-moss" : "text-burgundy"
              }
            >
              {actualAvg} pág/dia
            </span>{" "}
            · meta {dailyTarget}/dia pra terminar tudo
          </p>
        </div>

        {/* Bloco 2 — hoje */}
        <div className="md:border-l md:border-border/60 md:pl-4">
          <p className="text-xs uppercase tracking-wider text-ink-fade">
            Hoje
          </p>
          <p className="text-sm text-ink-deep mt-1">
            meta <span className="font-medium">{dailyTarget}p</span> · planejou{" "}
            {todayPlanned}p · leu{" "}
            <span
              className={todayActual >= dailyTarget ? "text-moss" : "text-ink-deep"}
            >
              {todayActual}p
            </span>
          </p>
          <p className="text-sm mt-0.5">
            {todayLeft > 0 && (
              <span className="text-burgundy">
                faltam {todayLeft}p pra bater a meta de hoje
              </span>
            )}
            {todayLeft <= 0 && (
              <span className="text-moss">meta de hoje batida ✓</span>
            )}
          </p>
        </div>

        {/* Bloco 3 — recuperação */}
        <div className="md:border-l md:border-border/60 md:pl-4">
          <p className="text-xs uppercase tracking-wider text-ink-fade">
            {behind ? "Pra recuperar" : "Situação"}
          </p>
          {behind && extraPerDay > 0 ? (
            <>
              <p className="text-sm text-ink-deep mt-1">
                <span className="font-medium">+{extraPerDay} pág/dia</span> nos{" "}
                {summary.remainingDays} dias restantes
              </p>
              <p className="text-sm text-ink-fade mt-0.5">
                ou re-planeje a partir de hoje pra zerar o atraso
              </p>
            </>
          ) : (
            <p className="text-sm text-moss mt-1">
              {planBalance >= 0 ? "no ritmo do plano ✓" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Card de agendamento por livro (maior)
// ============================================================================
function PlanBookCard({
  book,
  readOnly,
  monthPrefix,
  onPatch,
  onRemove,
}: {
  book: PlanBookRow;
  readOnly: boolean;
  monthPrefix: string;
  onPatch: (patch: Partial<PlanBookRow>) => void;
  onRemove: () => void;
}) {
  const schedule = deriveSchedule(book);
  const noPages = book.total_pages === null || book.total_pages <= 0;
  // `book.pages` já é o efetivo do mês (campo do usuário ou restante real).
  const effective = book.pages ?? 0;
  const realRemaining = book.remaining ?? 0;
  // Continuação (transbordo de outro mês) é só-leitura — edita no mês de origem.
  const effReadOnly = readOnly || book.is_continuation;
  const [mode, setMode] = useState<"pace" | "end">(
    book.end_date && !book.pages_per_day ? "end" : "pace",
  );
  const [paceDraft, setPaceDraft] = useState(
    book.pages_per_day ? String(book.pages_per_day) : "",
  );
  const [ptmDraft, setPtmDraft] = useState(
    book.pages_this_month != null ? String(book.pages_this_month) : "",
  );

  const savePace = () => {
    const n = Number(paceDraft);
    onPatch({
      pages_per_day: Number.isFinite(n) && n > 0 ? n : null,
      end_date: null,
    });
  };

  const savePtm = () => {
    const n = Number(ptmDraft);
    onPatch({
      pages_this_month: ptmDraft.trim() !== "" && Number.isFinite(n) && n > 0 ? n : null,
    });
  };

  return (
    <li className="rounded-lg border border-border bg-ivory-light p-4">
      <div className="flex gap-3">
        <div
          className="w-14 flex-shrink-0 relative rounded overflow-hidden border-l-[4px] shadow-sm"
          style={{ aspectRatio: "2 / 3", borderLeftColor: book.color }}
          aria-hidden
        >
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
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
            <div className="min-w-0">
              <Link
                href={`/book/${book.slug}`}
                className="font-display text-base text-ink-deep leading-tight line-clamp-2 hover:text-[#6D3914] transition-colors"
              >
                {book.title}
              </Link>
              {book.is_continuation && book.continuation_from && (
                <span className="block text-[11px] text-[#6D3914] italic mt-0.5">
                  continua de {monthNamePT(book.continuation_from.month)}
                </span>
              )}
            </div>
            {!effReadOnly && (
              <button
                type="button"
                onClick={onRemove}
                className="flex-shrink-0 p-1 -m-1 text-ink-fade hover:text-burgundy transition-colors"
                title="Remover do plano deste mês"
                aria-label={`Remover ${book.title} do plano`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Páginas: lidas / faltam / total */}
          {noPages ? (
            <p className="text-sm text-burgundy italic mt-1">
              sem nº de páginas cadastrado
            </p>
          ) : (
            <div className="mt-1.5 space-y-1">
              {book.pages_read > 0 && (
                <div className="h-1 w-full rounded-full bg-paper-soft overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((book.pages_read / (book.total_pages || 1)) * 100))}%`,
                      backgroundColor: book.color,
                    }}
                  />
                </div>
              )}
              <p className="text-sm text-ink-soft">
                {book.pages_read > 0 ? (
                  <>
                    <span className="font-medium text-ink-deep">
                      {realRemaining}
                    </span>{" "}
                    faltam · {book.pages_read} lidas de {book.total_pages}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-ink-deep">
                      {book.total_pages}
                    </span>{" "}
                    páginas
                  </>
                )}
              </p>
              {book.pages_this_month != null ? (
                <p className="text-xs text-[#6D3914]">
                  planeja ler {effective} neste mês · ~
                  {formatReadingTime(effective * SECONDS_PER_PAGE)}
                </p>
              ) : (
                <p className="text-xs text-ink-fade">
                  ~{formatReadingTime(effective * SECONDS_PER_PAGE)} restantes
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {!noPages && !effReadOnly && (
        <div className="mt-3 space-y-2 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-fade w-14 flex-shrink-0">
              Início
            </label>
            <input
              type="date"
              value={book.start_date ?? ""}
              onChange={(e) => onPatch({ start_date: e.target.value || null })}
              className="flex-1 rounded border border-border bg-paper-soft px-2 py-1.5 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-1 focus:ring-[#6D3914]/30 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-14 flex-shrink-0 flex gap-1">
              <button
                type="button"
                onClick={() => setMode("pace")}
                className={clsx(
                  "text-[11px] rounded px-1.5 py-0.5 transition-colors",
                  mode === "pace"
                    ? "bg-[#6D3914]/15 text-[#6D3914]"
                    : "text-ink-fade hover:text-ink-deep",
                )}
              >
                ritmo
              </button>
            </div>
            {mode === "pace" ? (
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={paceDraft}
                  onChange={(e) => setPaceDraft(e.target.value)}
                  onBlur={savePace}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") savePace();
                  }}
                  placeholder="0"
                  className="w-20 rounded border border-border bg-paper-soft px-2 py-1.5 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-1 focus:ring-[#6D3914]/30 outline-none"
                />
                <span className="text-xs text-ink-fade">pág/dia</span>
                <button
                  type="button"
                  onClick={() => setMode("end")}
                  className="ml-auto text-[11px] text-ink-fade hover:text-[#6D3914] underline underline-offset-2"
                >
                  usar data fim
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="date"
                  value={book.end_date ?? ""}
                  min={book.start_date ?? undefined}
                  onChange={(e) =>
                    onPatch({
                      end_date: e.target.value || null,
                      pages_per_day: null,
                    })
                  }
                  className="flex-1 rounded border border-border bg-paper-soft px-2 py-1.5 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-1 focus:ring-[#6D3914]/30 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMode("pace")}
                  className="text-[11px] text-ink-fade hover:text-[#6D3914] underline underline-offset-2 flex-shrink-0"
                >
                  usar ritmo
                </button>
              </div>
            )}
          </div>

          {/* Páginas só neste mês (opcional) — desconta o que vai pro mês
              seguinte da meta/total. Vazio = usa o restante inteiro. */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-fade w-14 flex-shrink-0 leading-tight">
              Neste mês
            </label>
            <input
              type="number"
              min={1}
              value={ptmDraft}
              onChange={(e) => setPtmDraft(e.target.value)}
              onBlur={savePtm}
              onKeyDown={(e) => {
                if (e.key === "Enter") savePtm();
              }}
              placeholder={`${realRemaining} (tudo)`}
              className="w-24 rounded border border-border bg-paper-soft px-2 py-1.5 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-1 focus:ring-[#6D3914]/30 outline-none"
            />
            <span className="text-[11px] text-ink-fade">
              páginas · resto vai pro próximo mês
            </span>
          </div>
        </div>
      )}

      {/* Resultado derivado + planejamento completo (item 3) */}
      {schedule ? (
        <>
          <p className="mt-2 text-xs text-ink-soft flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: book.color }}
              aria-hidden
            />
            {ddmm(schedule.start_date)} → {ddmm(schedule.end_date)} ·{" "}
            {schedule.pages_per_day} pág/dia (~
            {formatReadingTime(schedule.pages_per_day * SECONDS_PER_PAGE)}) ·{" "}
            {schedule.days} {schedule.days === 1 ? "dia" : "dias"}
          </p>
          <details className="mt-1.5">
            <summary className="text-xs text-[#6D3914] cursor-pointer hover:underline list-none">
              ver planejamento por dia
            </summary>
            <ul className="mt-1 max-h-40 overflow-y-auto custom-scrollbar text-xs space-y-0.5 pr-1">
              {Object.keys(schedule.allocations)
                .filter(
                  (d) =>
                    schedule.allocations[d] > 0 && d.startsWith(monthPrefix),
                )
                .sort()
                .map((d) => {
                  const planned = schedule.allocations[d];
                  const done = book.actualByDay?.[d] ?? 0;
                  return (
                    <li
                      key={d}
                      className="flex items-center justify-between gap-2 text-ink-soft"
                    >
                      <span>{ddmm(d)}</span>
                      <span className="tabular-nums">
                        plano {planned}p
                        {done > 0 && (
                          <span
                            className={
                              done >= planned ? "text-moss" : "text-burgundy"
                            }
                          >
                            {" · "}lido {done}p
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </details>
        </>
      ) : (
        !noPages && (
          <p className="mt-2 text-xs italic text-ink-fade">
            {effReadOnly
              ? "não agendado"
              : "defina o ritmo aqui, ou clique nos dias do calendário pra planejar"}
          </p>
        )
      )}
    </li>
  );
}

// ============================================================================
// Calendário (desktop) — células maiores com tempo por dia
// ============================================================================
function MonthCalendar({
  summary,
  todayISO,
  onDayClick,
  className,
}: {
  summary: ReturnType<typeof buildPlanSummary>;
  todayISO: string;
  onDayClick?: (cell: DayCell) => void;
  className?: string;
}) {
  const firstWeekday = new Date(
    Date.UTC(summary.year, summary.month - 1, 1),
  ).getUTCDay();
  const blanks = Array.from({ length: firstWeekday });

  return (
    <div className={className}>
      <div className="grid grid-cols-7 gap-2">
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
        {summary.cells.map((cell) => {
          const isToday = cell.iso === todayISO;
          // Só compara plano×real nos dias que já passaram.
          const diff = cell.actual - cell.planned;
          const hasActual = cell.actual > 0;
          const loggable = !!onDayClick; // qualquer dia: planejar (futuro) ou registrar (passado)
          return (
            <div
              key={cell.iso}
              onClick={loggable ? () => onDayClick!(cell) : undefined}
              role={loggable ? "button" : undefined}
              tabIndex={loggable ? 0 : undefined}
              className={clsx(
                "min-h-[150px] rounded-md border p-2 flex flex-col gap-1",
                isToday
                  ? "border-[#6D3914] bg-[#6D3914]/[0.04]"
                  : "border-border bg-ivory-light",
                loggable &&
                  "cursor-pointer hover:border-[#6D3914]/60 hover:shadow-sm transition-all",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    "text-sm font-medium",
                    isToday ? "text-[#6D3914]" : "text-ink-fade",
                  )}
                >
                  {cell.day}
                </span>
                {cell.planned > 0 && (
                  <span
                    className="text-[11px] tabular-nums px-1.5 rounded-full text-ink-fade bg-paper-soft"
                    title={`planejado ${cell.planned} páginas`}
                  >
                    {cell.planned}p
                  </span>
                )}
              </div>

              {/* Barras planejadas por livro */}
              <div className="flex flex-col gap-1 overflow-hidden flex-1">
                {cell.entries.map((e) => (
                  <span
                    key={e.book_id}
                    className="text-[11px] leading-tight rounded px-1.5 py-1 text-ivory"
                    style={{ backgroundColor: e.color }}
                    title={`${e.title} · plano ${e.pages} pág`}
                  >
                    <span className="font-medium">{e.pages}p</span>{" "}
                    <span className="opacity-90 line-clamp-1">{e.title}</span>
                  </span>
                ))}
              </div>

              {/* Real do dia (o que foi lido) */}
              {(hasActual || (cell.isPast && cell.planned > 0)) && (
                <div
                  className={clsx(
                    "text-[10px] rounded px-1 py-0.5 flex items-center justify-between gap-1",
                    diff >= 0
                      ? "text-moss bg-moss/10"
                      : "text-burgundy bg-burgundy/10",
                  )}
                  title={`lido ${cell.actual} · planejado ${cell.planned}`}
                >
                  <span>✓ {cell.actual}p</span>
                  {cell.planned > 0 && (
                    <span className="tabular-nums">
                      {diff >= 0 ? "+" : ""}
                      {diff}
                    </span>
                  )}
                </div>
              )}

              {cell.planned > 0 && !cell.isPast && (
                <p className="text-[10px] text-ink-fade italic text-right">
                  ~{formatReadingTime(cell.planned * SECONDS_PER_PAGE)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Agenda (mobile) — só dias com leitura
// ============================================================================
function MonthAgenda({
  summary,
  todayISO,
  onDayClick,
  className,
}: {
  summary: ReturnType<typeof buildPlanSummary>;
  todayISO: string;
  onDayClick?: (cell: DayCell) => void;
  className?: string;
}) {
  const active = summary.cells.filter(
    (c) => c.entries.length > 0 || c.actual > 0,
  );
  if (active.length === 0) {
    return (
      <p className={clsx("text-sm italic text-ink-fade py-4", className)}>
        Nenhum dia agendado ainda. Defina o ritmo dos livros abaixo.
      </p>
    );
  }
  return (
    <ul className={clsx("space-y-2", className)}>
      {active.map((cell) => {
        const isToday = cell.iso === todayISO;
        const weekday = new Date(`${cell.iso}T00:00:00Z`).getUTCDay();
        const diff = cell.actual - cell.planned;
        const loggable = !!onDayClick;
        return (
          <li
            key={cell.iso}
            onClick={loggable ? () => onDayClick!(cell) : undefined}
            role={loggable ? "button" : undefined}
            className={clsx(
              "rounded-md border p-2.5",
              isToday
                ? "border-[#6D3914] bg-[#6D3914]/[0.04]"
                : "border-border bg-ivory-light",
              loggable && "cursor-pointer active:bg-paper-soft",
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className={clsx(
                  "text-sm font-medium",
                  isToday ? "text-[#6D3914]" : "text-ink-deep",
                )}
              >
                {WEEKDAYS[weekday]} {cell.day}
                {isToday && " · hoje"}
              </span>
              <span className="text-xs tabular-nums text-ink-fade">
                plano {cell.planned}p
                {(cell.actual > 0 || cell.isPast) && (
                  <>
                    {" · "}
                    <span className={diff >= 0 ? "text-moss" : "text-burgundy"}>
                      lido {cell.actual}p
                    </span>
                  </>
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {cell.entries.map((e) => {
                const done = cell.actualEntries.find(
                  (a) => a.book_id === e.book_id,
                );
                return (
                  <span
                    key={e.book_id}
                    className="text-sm rounded px-2 py-1 text-ivory flex items-center justify-between gap-2"
                    style={{ backgroundColor: e.color }}
                  >
                    <span className="truncate">{e.title}</span>
                    <span className="flex-shrink-0 tabular-nums">
                      {done ? `${done.pages}/` : ""}
                      {e.pages}p
                    </span>
                  </span>
                );
              })}
              {/* Livros lidos que não estavam no plano do dia */}
              {cell.actualEntries
                .filter(
                  (a) => !cell.entries.some((e) => e.book_id === a.book_id),
                )
                .map((a) => (
                  <span
                    key={a.book_id}
                    className="text-sm rounded px-2 py-1 flex items-center justify-between gap-2 border border-dashed"
                    style={{ borderColor: a.color, color: a.color }}
                  >
                    <span className="truncate">✓ {a.title}</span>
                    <span className="flex-shrink-0 tabular-nums">
                      {a.pages}p
                    </span>
                  </span>
                ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
