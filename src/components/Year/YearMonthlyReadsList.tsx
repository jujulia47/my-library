import Link from "next/link";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { labelForPurchaseOrigin } from "@/utils/labels";
import type { FinishedBookEntry } from "@/services/yearData";

const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return String(d.getUTCDate()).padStart(2, "0");
}

function monthOf(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getUTCMonth() + 1;
}

type Props = {
  books: FinishedBookEntry[];
};

/**
 * Listagem dos livros lidos no ano agrupada por mês — tabela com nome,
 * dia, avaliação e origem (assinatura / clube / compra etc). Complementa
 * a "Linha do tempo" (que mostra duração) e o "Livros lidos em YYYY"
 * (que mostra quantidade) — aqui é pra ver QUAIS livros foram lidos
 * em cada mês.
 */
export function YearMonthlyReadsList({ books }: Props) {
  if (books.length === 0) return null;

  // Agrupa por mês cronologicamente. Vai de janeiro a dezembro mas só
  // renderiza meses com pelo menos 1 livro.
  const byMonth = new Map<number, FinishedBookEntry[]>();
  for (const b of books) {
    const m = monthOf(b.finish_date);
    const arr = byMonth.get(m) ?? [];
    arr.push(b);
    byMonth.set(m, arr);
  }
  const months = [...byMonth.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-6">
      {months.map(([month, entries]) => (
        <section key={month}>
          <header className="flex items-baseline justify-between gap-3 mb-2 pb-1 border-b border-paper-soft">
            <h3 className="font-display text-lg text-ink-deep">
              {MONTH_NAMES_PT[month - 1]}
            </h3>
            <span className="font-body text-xs italic text-ink-fade">
              {entries.length} {entries.length === 1 ? "livro" : "livros"}
            </span>
          </header>

          {/* Tabela densa em desktop, vira lista de cards no mobile. */}
          <div className="hidden md:block">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-ink-fade">
                  <th className="text-left py-1.5 pl-2 font-medium w-12">
                    Dia
                  </th>
                  <th className="text-left py-1.5 font-medium">Título</th>
                  <th className="text-left py-1.5 font-medium w-28">
                    Avaliação
                  </th>
                  <th className="text-left py-1.5 font-medium w-44">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-soft">
                {entries.map((b) => (
                  <ReadRow key={`${b.slug}-${b.finish_date}`} book={b} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: lista vertical sem tabela. */}
          <ul className="md:hidden divide-y divide-paper-soft">
            {entries.map((b) => (
              <ReadRowMobile
                key={`${b.slug}-${b.finish_date}`}
                book={b}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function originLabel(book: FinishedBookEntry): string | null {
  if (book.subscription_name) return book.subscription_name;
  if (book.purchase_origin) return labelForPurchaseOrigin(book.purchase_origin);
  return null;
}

function StarsInline({ rating }: { rating: number | null }) {
  if (rating === null || rating <= 0) {
    return <span className="text-ink-fade text-xs italic">—</span>;
  }
  const full = Math.floor(rating);
  const empty = 5 - full;
  return (
    <span className="inline-flex items-center gap-0.5 text-gold-deep">
      {Array.from({ length: full }, (_, i) => (
        <StarSolidIcon key={`f${i}`} className="w-3.5 h-3.5" />
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <StarOutlineIcon
          key={`e${i}`}
          className="w-3.5 h-3.5 text-ink-fade/40"
        />
      ))}
    </span>
  );
}

function ReadRow({ book }: { book: FinishedBookEntry }) {
  const origin = originLabel(book);
  return (
    <tr className="hover:bg-paper-soft/60 transition-colors">
      <td className="py-2 pl-2 text-ink-fade font-mono tabular-nums">
        {formatDay(book.finish_date)}
      </td>
      <td className="py-2">
        <Link
          href={`/book/${book.slug}`}
          className="font-display text-ink-deep hover:text-gold-deep transition-colors"
        >
          {book.title}
        </Link>
        {book.author_name && (
          <span className="text-ink-fade italic"> · {book.author_name}</span>
        )}
      </td>
      <td className="py-2">
        <StarsInline rating={book.rating} />
      </td>
      <td className="py-2">
        {origin ? (
          <span className="text-xs text-ink-soft italic">{origin}</span>
        ) : (
          <span className="text-xs text-ink-fade italic">—</span>
        )}
      </td>
    </tr>
  );
}

function ReadRowMobile({ book }: { book: FinishedBookEntry }) {
  const origin = originLabel(book);
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-body text-[10px] uppercase tracking-wider text-ink-fade">
            dia {formatDay(book.finish_date)}
          </p>
          <Link
            href={`/book/${book.slug}`}
            className="font-display text-ink-deep hover:text-gold-deep transition-colors text-base block leading-tight"
          >
            {book.title}
          </Link>
          {book.author_name && (
            <p className="text-xs italic text-ink-fade truncate">
              {book.author_name}
            </p>
          )}
          {origin && (
            <p className="text-xs italic text-ink-soft mt-1">{origin}</p>
          )}
        </div>
        <StarsInline rating={book.rating} />
      </div>
    </li>
  );
}
