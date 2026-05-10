import CountryBadge from "@/components/ui/CountryBadge";
import type { CountryEntry } from "@/services/yearData";

type Props = {
  countries: CountryEntry[];
};

export function YearCountries({ countries }: Props) {
  if (countries.length === 0) return null;

  const maxCount = Math.max(...countries.map((c) => c.count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
      {countries.map((c) => {
        const widthPct = (c.count / maxCount) * 100;
        return (
          <div
            key={c.country}
            className="grid grid-cols-[1fr_5rem_2rem] items-center gap-2 py-1"
          >
            <CountryBadge country={c.country} />
            <span className="h-1.5 rounded-full bg-paper overflow-hidden" aria-hidden>
              <span
                className="block h-full rounded-full bg-cappuccino"
                style={{ width: `${widthPct}%` }}
              />
            </span>
            <span className="text-xs text-ink-soft tabular-nums text-right">
              {c.count} {c.count === 1 ? "autor" : "autores"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
