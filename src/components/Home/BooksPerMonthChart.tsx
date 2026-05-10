"use client";

const MONTH_LETTERS = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
];

type Props = {
  data: { month: number; count: number }[];
  currentMonth: number; // 1..12
};

export function BooksPerMonthChart({ data, currentMonth }: Props) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalRead = data
    .filter((d) => d.month <= currentMonth)
    .reduce((sum, d) => sum + d.count, 0);
  const monthsElapsed = Math.max(1, currentMonth);
  const avgPerMonth = (totalRead / monthsElapsed).toFixed(1).replace(".", ",");

  return (
    <div className="bg-paper border border-paper-soft rounded-lg p-3.5">
      <div className="flex justify-between items-baseline mb-2.5">
        <p className="text-xs font-body font-medium text-ink-deep uppercase tracking-wider">
          Livros por mês
        </p>
        <span className="text-[10px] italic text-ink-fade">
          média {avgPerMonth}/mês
        </span>
      </div>

      <div
        className="grid grid-cols-12 gap-2 items-end"
        style={{ height: 64 }}
      >
        {data.map((entry, idx) => {
          const isFuture = entry.month > currentMonth;
          const isCurrent = entry.month === currentMonth;
          // Meses futuros NÃO renderizam barra (só label cinza do mês). Mês
          // corrente em gradient navy. Demais em gradient gold-deep → gold
          // (vertical, base mais escura).
          const heightPct =
            entry.count > 0
              ? (entry.count / maxCount) * 100
              : isFuture
                ? 0
                : 14;
          const barGradient = isCurrent
            ? "linear-gradient(180deg, var(--color-navy-soft) 0%, var(--color-navy) 100%)"
            : "linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)";
          return (
            <div
              key={entry.month}
              className="flex flex-col items-center gap-0.5 h-full justify-end"
            >
              <span
                className={`text-[10px] leading-none font-mono tabular-nums ${
                  entry.count > 0 ? "text-ink-soft" : "text-ink-fade/60"
                }`}
              >
                {entry.count > 0 ? entry.count : ""}
              </span>
              {!isFuture && (
                <div
                  className="rounded-t origin-bottom"
                  style={{
                    width: 14,
                    maxWidth: "100%",
                    height: `${heightPct}%`,
                    background: barGradient,
                    transform: "scaleY(0)",
                    animation: `barGrow 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${
                      idx * 50
                    }ms forwards`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-1 mt-1.5">
        {MONTH_LETTERS.map((m, i) => {
          const isCurrent = i + 1 === currentMonth;
          return (
            <span
              key={i}
              className={`text-[9px] text-center font-body ${
                isCurrent
                  ? "text-ink-deep font-medium"
                  : i + 1 > currentMonth
                    ? "text-ink-fade/60"
                    : "text-ink-fade"
              }`}
            >
              {m}
            </span>
          );
        })}
      </div>
    </div>
  );
}
