import type { NamedCount } from "@/services/overviewData";

type Props = {
  data: NamedCount[];
  /** Sufixo da contagem (ex.: "livros"). */
  unit?: string;
  emptyMessage?: string;
};

/** Lista de barras horizontais label + barra + contagem (genérica). */
export function BarList({
  data,
  unit,
  emptyMessage = "Sem dados ainda.",
}: Props) {
  if (data.length === 0) {
    return <p className="text-sm italic text-ink-fade py-4">{emptyMessage}</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div
          key={d.label}
          className="grid grid-cols-[8rem_1fr_3.5rem] items-center gap-2"
        >
          <span className="text-xs text-ink-soft truncate" title={d.label}>
            {d.label}
          </span>
          <span
            className="h-2 rounded-full bg-paper-soft overflow-hidden"
            aria-hidden
          >
            <span
              className="block h-full rounded-full bg-cappuccino"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </span>
          <span className="text-xs text-ink-fade tabular-nums text-right">
            {d.count}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
