/**
 * Decoração de fundo sutil da vista "livro abrindo". SVG abstrato com pattern
 * de lombadas — sugere "estante atrás" sem renderizar dados reais (caro).
 * `opacity 0.18` deixa o fundo escuro respirar; `pointer-events-none` evita
 * interceptar clicks.
 */
export function ShelfBackgroundDecoration() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.18, zIndex: 0 }}
      aria-hidden
    >
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 800"
      >
        <defs>
          <pattern
            id="library-spine-pattern"
            width="200"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width="14" height="80" fill="#6B2A2A" />
            <rect x="16" y="0" width="20" height="80" fill="#5C3F1A" />
            <rect x="38" y="0" width="12" height="80" fill="#1A4D2E" />
            <rect x="52" y="0" width="22" height="80" fill="#4A2A6E" />
            <rect x="76" y="0" width="14" height="80" fill="#6E4A2A" />
            <rect x="92" y="0" width="18" height="80" fill="#5C2A4A" />
            <rect x="112" y="0" width="16" height="80" fill="#2A3E5C" />
            <rect x="130" y="0" width="20" height="80" fill="#854F0B" />
            <rect x="152" y="0" width="14" height="80" fill="#3E2810" />
            <rect x="168" y="0" width="18" height="80" fill="#2E4A2E" />
            <rect x="188" y="0" width="12" height="80" fill="#5C2A1A" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#library-spine-pattern)" />
      </svg>
    </div>
  );
}
