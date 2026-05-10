/**
 * Ilustração decorativa de uma estante com lombadas. Usada na detail page do
 * livro quando `ownership_status === 'owned'`. Cores das lombadas vêm dos
 * tokens da paleta via `var(--color-*)` pra acompanhar o tema.
 */
export default function BookshelfDecoration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      width="180"
      height="100"
      viewBox="0 0 180 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* prateleiras superior e inferior */}
      <rect x="10" y="78" width="160" height="4" fill="var(--color-cappuccino-soft)" />
      <rect x="10" y="14" width="160" height="2" fill="var(--color-cappuccino-soft)" />

      {/* lombadas — cores variando da paleta */}
      <rect x="22" y="20" width="11" height="58" fill="var(--color-burgundy)" rx="1" />
      <rect x="35" y="26" width="9" height="52" fill="var(--color-moss)" rx="1" />
      <rect x="46" y="22" width="13" height="56" fill="var(--color-ink-deep)" rx="1" />
      <rect x="61" y="28" width="10" height="50" fill="var(--color-navy)" rx="1" />
      <rect x="73" y="20" width="11" height="58" fill="var(--color-terracota)" rx="1" />
      <rect x="86" y="24" width="9" height="54" fill="var(--color-burgundy)" rx="1" />
      <rect x="97" y="26" width="12" height="52" fill="var(--color-cappuccino)" rx="1" />
      <rect x="111" y="22" width="10" height="56" fill="var(--color-moss)" rx="1" />
      <rect x="123" y="28" width="11" height="50" fill="var(--color-navy)" rx="1" />
      <rect x="136" y="20" width="9" height="58" fill="var(--color-burgundy)" rx="1" />
      <rect x="147" y="26" width="12" height="52" fill="var(--color-terracota)" rx="1" />
    </svg>
  );
}
