import clsx from "clsx";
import { COUNTRY_CODES, COUNTRY_LABELS } from "@/utils/countryLabels";
import type { Database } from "@/utils/typings/supabase";

type Country = Database["public"]["Enums"]["country"];

export type CountryBadgeProps = {
  country: Country;
  /** Mostra o nome PT-BR do país ao lado da bandeira. Default: true. */
  showLabel?: boolean;
  className?: string;
};

/**
 * Bandeira SVG real via flag-icons (sessão 13.3) — substitui o badge texto
 * da 13.2. CSS usa `fi fi-{iso2-lowercase}` pra renderizar a SVG embutida.
 * Cross-platform garantido (não depende de emoji do OS).
 */
export default function CountryBadge({
  country,
  showLabel = true,
  className,
}: CountryBadgeProps) {
  const iso = COUNTRY_CODES[country].toLowerCase();
  const label = COUNTRY_LABELS[country];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-sm",
        className,
      )}
    >
      <span
        className={`fi fi-${iso}`}
        style={{
          width: "18px",
          height: "13px",
          borderRadius: "2px",
          display: "inline-block",
          flexShrink: 0,
        }}
        role="img"
        aria-label={label}
      />
      {showLabel && <span className="text-ink-soft">{label}</span>}
    </span>
  );
}
