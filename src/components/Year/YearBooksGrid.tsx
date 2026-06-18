"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { setYearReadingGoal } from "@/actions/setYearReadingGoal";
import type { FinishedBookEntry } from "@/services/yearData";

const MONTH_SHORT_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const DEFAULT_GOAL = 50;

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()}/${MONTH_SHORT_PT[d.getUTCMonth()]}`;
}

type Props = {
  books: FinishedBookEntry[];
  year: number;
  /** Meta configurada pelo user (tabela `reading_goal`). `null` = nunca
   *  definiu, UI mostra o default 50. */
  goal: number | null;
};

/**
 * Grid de marcação "Livros lidos em YYYY", estilo página de bullet journal.
 * Cada quadradinho numerado é uma posição cronológica; quando preenchido,
 * mostra como um carimbo discreto. Hover revela título + data; click vai pro
 * livro. Slots acima da meta ficam em verde como bônus.
 *
 * A meta é editável inline: clique em "meta: N" → input → Enter salva via
 * `setYearReadingGoal` action.
 */
export function YearBooksGrid({ books, year, goal: persistedGoal }: Props) {
  const router = useRouter();
  // Estado local da meta com fallback no default. Mantemos uma cópia
  // separada do que veio do servidor (`persistedGoal`) pra fazer update
  // otimista — se a action falhar, revertemos.
  const [goal, setGoal] = useState<number>(persistedGoal ?? DEFAULT_GOAL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(persistedGoal ?? DEFAULT_GOAL));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setGoal(persistedGoal ?? DEFAULT_GOAL);
    setDraft(String(persistedGoal ?? DEFAULT_GOAL));
  }, [persistedGoal]);

  if (books.length === 0 && goal === 0) return null;

  const totalNeeded = Math.max(goal, books.length);
  const totalSlots = Math.ceil(totalNeeded / 10) * 10;

  const slots: { ordinal: number; book: FinishedBookEntry | null }[] = [];
  for (let i = 0; i < totalSlots; i += 1) {
    const ordinal = i + 1;
    slots.push({ ordinal, book: books[i] ?? null });
  }

  const reachedGoal = books.length >= goal;
  const overGoalCount = Math.max(0, books.length - goal);

  const startEdit = () => {
    setDraft(String(goal));
    setEditing(true);
    setError(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setDraft(String(goal));
  };

  const commitEdit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
      setError("Meta deve ser inteiro entre 1 e 1000.");
      return;
    }
    if (parsed === goal) {
      setEditing(false);
      setError(null);
      return;
    }
    const previousGoal = goal;
    setGoal(parsed); // otimista
    setEditing(false);
    setError(null);
    startTransition(async () => {
      const result = await setYearReadingGoal(year, parsed);
      if (!result.ok) {
        setGoal(previousGoal);
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className="mt-2">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display text-xl text-ink-deep">
            Livros lidos em {year}
          </h2>
          <p className="font-body text-xs italic text-ink-fade mt-0.5">
            {reachedGoal ? (
              <>
                <span className="text-moss font-medium not-italic">
                  ✓ meta atingida
                </span>
                {overGoalCount > 0 && (
                  <> · +{overGoalCount} de bônus 🎉</>
                )}
              </>
            ) : (
              <>
                {books.length} de {goal} · faltam {goal - books.length}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-body text-ink-soft">
          <span className="inline-block w-3 h-3 rounded-sm bg-gold/30 border border-gold/60" />
          <span>lido</span>
          <span className="inline-block w-3 h-3 rounded-sm bg-moss/30 border border-moss/60 ml-2" />
          <span>bônus</span>
          <span className="inline-block w-3 h-3 rounded-sm border border-dashed border-ink-fade/50 ml-2" />
          <span>a ler</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2.5 justify-start">
        {slots.map((s) => (
          <BookSlot
            key={s.ordinal}
            ordinal={s.ordinal}
            book={s.book}
            goal={goal}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 mr-1 text-sm italic">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commitEdit();
            }}
            className="inline-flex items-center gap-1.5"
          >
            <span className="text-ink-fade not-italic">meta:</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelEdit();
              }}
              autoFocus
              disabled={isPending}
              className="w-16 text-xs not-italic text-ink-deep border border-gold/50 rounded px-1.5 py-0.5 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
            />
            <button
              type="submit"
              disabled={isPending}
              className="text-[10px] not-italic text-gold-deep hover:text-ink-deep transition-colors"
            >
              salvar
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isPending}
              className="text-[10px] not-italic text-ink-fade hover:text-ink-deep transition-colors"
            >
              cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1 text-ink-fade hover:text-gold-deep transition-colors group"
            title="Clique para editar a meta"
          >
            meta: {goal} ★
            <PencilSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity not-italic" />
          </button>
        )}
        {error && (
          <span className="text-[10px] not-italic text-burgundy">{error}</span>
        )}
      </div>
    </section>
  );
}

function BookSlot({
  ordinal,
  book,
  goal,
}: {
  ordinal: number;
  book: FinishedBookEntry | null;
  goal: number;
}) {
  const isFilled = !!book;
  // Bônus: o slot foi preenchido E está além da meta — distingue visualmente
  // os "extras" (verde) dos slots dentro da meta (dourado).
  const isOverGoal = isFilled && ordinal > goal;
  const isGoalLine = ordinal === goal;

  // Tamanho fixo (56×56) — funciona com flex-wrap pra empacotar os
  // quadradinhos um do lado do outro como num diário. Era pra ser
  // `aspect-square` em grid mas o cálculo dava célula gigante esticada.
  const baseClasses =
    "w-14 h-14 flex-shrink-0 rounded-md flex items-center justify-center text-sm font-body select-none relative";

  if (!isFilled) {
    return (
      <div
        className={clsx(
          baseClasses,
          "border border-dashed",
          isGoalLine
            ? "border-gold-deep/60 text-gold-deep font-medium"
            : "border-ink-fade/30 text-ink-fade/70",
        )}
        title={isGoalLine ? "meta do ano" : `${ordinal}º livro do ano`}
      >
        {ordinal}
      </div>
    );
  }

  const tooltip = `${ordinal}º — ${book.title} · ${formatShortDate(book.finish_date)}`;

  return (
    <Link
      href={`/book/${book.slug}`}
      title={tooltip}
      aria-label={tooltip}
      className={clsx(
        baseClasses,
        "border font-medium transition-transform hover:scale-110 hover:shadow-sm",
        isOverGoal
          ? "bg-moss/15 border-moss/60 text-moss"
          : "bg-gold/15 border-gold/50 text-ink-deep",
      )}
    >
      <span>{ordinal}</span>
      {book.is_favorite && (
        <StarSolidIcon className="absolute -top-1 -right-1 w-3 h-3 text-gold" />
      )}
      {book.rating === 5 && !book.is_favorite && (
        <StarOutlineIcon className="absolute -top-1 -right-1 w-3 h-3 text-gold" />
      )}
    </Link>
  );
}
