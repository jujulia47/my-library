"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { addHomeNextRead } from "@/actions/addHomeNextRead";
import { removeHomeNextRead } from "@/actions/removeHomeNextRead";
import { currentMonthISO, addMonthsISO } from "@/utils/dates";
import { monthNamePT } from "@/utils/readingPlan";

function monthLabel(iso: string): string {
  return `${monthNamePT(Number(iso.slice(5, 7)))} ${iso.slice(0, 4)}`;
}

type Props = {
  bookId: string;
  /** Meses (YYYY-MM-01) em que o livro já está no plano. */
  planMonths: string[];
};

/**
 * Bloco "Plano de leitura" na página do livro: adicionar o livro ao plano de
 * um mês (atual + próximos 12) e ver/remover os meses em que já está. Não
 * mexe no status de leitura.
 */
export default function BookPlanSection({ bookId, planMonths }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const options = useMemo(() => {
    const base = currentMonthISO();
    return Array.from({ length: 13 }, (_, i) => addMonthsISO(base, i));
  }, []);
  const [selected, setSelected] = useState(options[0]);

  const planned = [...planMonths].sort();
  const already = planned.includes(selected);

  const handleAdd = () => {
    startTransition(async () => {
      const res = await addHomeNextRead(bookId, selected);
      if (res.ok) router.refresh();
    });
  };

  const handleRemove = (month: string) => {
    startTransition(async () => {
      const res = await removeHomeNextRead(bookId, month);
      if (res.ok) router.refresh();
    });
  };

  return (
    <section className="rounded-lg border border-border bg-paper p-4">
      <h2 className="text-sm uppercase tracking-wider text-ink-fade flex items-center gap-1.5 mb-3">
        <CalendarDaysIcon className="w-4 h-4 text-[#6D3914]" />
        Plano de leitura
      </h2>

      <div className="flex items-end gap-2">
        <label className="flex-1 min-w-0">
          <span className="block text-xs text-ink-fade mb-1">
            Adicionar ao mês
          </span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-md border border-border bg-ivory-light px-3 py-2 text-sm text-ink-deep focus:outline-none focus:border-[#6D3914]/50"
          >
            {options.map((iso) => (
              <option key={iso} value={iso}>
                {monthLabel(iso)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || already}
          className="inline-flex items-center gap-1 rounded-md bg-[#6D3914] px-3 py-2 text-sm text-ivory hover:bg-[#5a2f10] disabled:opacity-40 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {already ? "Já no plano" : "Adicionar"}
        </button>
      </div>

      {planned.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {planned.map((month) => (
            <li
              key={month}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#6D3914]/30 bg-[#6D3914]/[0.05] pl-3 pr-1.5 py-1 text-sm text-ink-deep"
            >
              <Link
                href={`/plano?mes=${month.slice(0, 7)}`}
                className="hover:text-[#6D3914] transition-colors"
              >
                {monthLabel(month)}
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(month)}
                disabled={pending}
                className="text-ink-fade hover:text-burgundy transition-colors"
                aria-label={`Remover de ${monthLabel(month)}`}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-ink-fade italic">
        Livros do mês atual aparecem em Próximas leituras na home (se não
        estiverem em leitura). Não altera o status do livro.
      </p>
    </section>
  );
}
