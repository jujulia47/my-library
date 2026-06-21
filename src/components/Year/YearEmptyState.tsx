import Link from "next/link";

type Props = {
  year: number;
  availableYears: number[];
};

export function YearEmptyState({ year, availableYears }: Props) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20 text-center">
      <p className="font-display text-2xl text-ink-deep mb-2">
        Nada por aqui em {year}.
      </p>
      <p className="text-sm italic text-ink-fade mb-6">
        Você não registrou leituras nem aquisições neste ano.
      </p>
      {availableYears.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wider text-ink-fade mb-2">
            Ver outro ano
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {availableYears.map((y) => (
              <Link
                key={y}
                href={`/year/${y}`}
                className="text-sm px-3 py-1.5 border border-border rounded-md text-ink-soft hover:border-roasted-chestnut hover:text-ink-deep transition-colors"
              >
                {y}
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
