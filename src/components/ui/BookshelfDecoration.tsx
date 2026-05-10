/**
 * Ilustração decorativa de uma estante com lombadas — usada na detail page do
 * livro quando `ownership_status === 'owned'`. Estética vintage (prateleira de
 * madeira + frisos dourados), mas com paleta vivid pra os livros: a versão
 * anterior usava CSS vars semânticas com overlays escuros pesados (gradient
 * spine-leather + raised bands com rgba preto), e em SVG pequeno o resultado
 * desbotava. Agora as cores são saturadas e os overlays foram aliviados
 * pra a cor respirar.
 */

// Paleta unificada com a `MiniBookshelf` — saturada, cobre todo o círculo
// cromático sem cair em pastéis. Mesma família visual nos dois componentes.
const SHELF_PALETTE = [
  "#C44A1F", // burnt orange
  "#3B7A14", // green
  "#1B5DB5", // royal blue
  "#B0405E", // berry pink
  "#5B4AB9", // purple
  "#CC8A1F", // amber gold
  "#1F8D7C", // teal
  "#B23545", // coral red
  "#6F4FB2", // violet
  "#2E6FA8", // sky blue
  "#5D7B23", // olive vivid
  "#903478", // magenta
];

export default function BookshelfDecoration({
  className,
}: {
  className?: string;
}) {
  // 12 lombadas com larguras/alturas variadas pra dar naturalidade.
  const spines: Array<{ x: number; w: number; h: number; color: string }> = [
    { x: 22, w: 11, h: 58, color: SHELF_PALETTE[0] },
    { x: 34, w: 9, h: 52, color: SHELF_PALETTE[1] },
    { x: 44, w: 13, h: 60, color: SHELF_PALETTE[2] },
    { x: 58, w: 10, h: 50, color: SHELF_PALETTE[3] },
    { x: 69, w: 11, h: 58, color: SHELF_PALETTE[4] },
    { x: 81, w: 9, h: 54, color: SHELF_PALETTE[5] },
    { x: 91, w: 12, h: 52, color: SHELF_PALETTE[6] },
    { x: 104, w: 10, h: 56, color: SHELF_PALETTE[7] },
    { x: 115, w: 11, h: 50, color: SHELF_PALETTE[8] },
    { x: 127, w: 9, h: 58, color: SHELF_PALETTE[9] },
    { x: 137, w: 12, h: 52, color: SHELF_PALETTE[10] },
    { x: 150, w: 10, h: 56, color: SHELF_PALETTE[11] },
  ];

  const SHELF_TOP = 78;

  return (
    <svg
      width="180"
      height="100"
      viewBox="0 0 180 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* Madeira da prateleira — gradient escuro com variação tonal */}
        <linearGradient id="shelf-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A2E1A" />
          <stop offset="35%" stopColor="#3A2418" />
          <stop offset="100%" stopColor="#2A1810" />
        </linearGradient>
        {/* Highlight dourado no verniz topo da prateleira */}
        <linearGradient id="shelf-varnish" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(212, 176, 86, 0.55)" />
          <stop offset="100%" stopColor="rgba(212, 176, 86, 0)" />
        </linearGradient>
        {/* Sombra de couro MUITO sutil — antes era 0.32 na direita, agora
            0.10 só pra dar mínima profundidade sem desbotar a cor. */}
        <linearGradient id="spine-leather" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
          <stop offset="50%" stopColor="rgba(0, 0, 0, 0)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.10)" />
        </linearGradient>
      </defs>

      {/* Filete dourado superior — separador estilo frontispício */}
      <line
        x1="14"
        y1="14"
        x2="166"
        y2="14"
        stroke="rgba(212, 176, 86, 0.7)"
        strokeWidth="0.6"
      />
      <circle cx="90" cy="14" r="1.2" fill="rgba(212, 176, 86, 0.85)" />

      {/* Lombadas */}
      {spines.map((s, i) => {
        const top = SHELF_TOP - s.h;
        return (
          <g key={i}>
            {/* Corpo do livro — cor vivid full opacity */}
            <rect
              x={s.x}
              y={top}
              width={s.w}
              height={s.h}
              fill={s.color}
              rx="0.5"
            />
            {/* Highlight + sombra muito sutis pra dar dimensão */}
            <rect
              x={s.x}
              y={top}
              width={s.w}
              height={s.h}
              fill="url(#spine-leather)"
              rx="0.5"
            />
            {/* Friso dourado bem fino no topo do livro */}
            <line
              x1={s.x + 1}
              y1={top + 0.8}
              x2={s.x + s.w - 1}
              y2={top + 0.8}
              stroke="rgba(240, 192, 64, 0.85)"
              strokeWidth="0.5"
            />
            {/* Friso dourado bem fino na base */}
            <line
              x1={s.x + 1}
              y1={top + s.h - 0.8}
              x2={s.x + s.w - 1}
              y2={top + s.h - 0.8}
              stroke="rgba(240, 192, 64, 0.85)"
              strokeWidth="0.5"
            />
            {/* Faixa dourada decorativa no meio (vez de raised bands escuros) —
                sutil, sugere ornamento de capa sem virar listra preta. */}
            <line
              x1={s.x + 1.5}
              y1={top + s.h * 0.5}
              x2={s.x + s.w - 1.5}
              y2={top + s.h * 0.5}
              stroke="rgba(240, 192, 64, 0.55)"
              strokeWidth="0.4"
            />
          </g>
        );
      })}

      {/* Prateleira de madeira (com gradient + verniz dourado no topo) */}
      <rect x="10" y={SHELF_TOP} width="160" height="6" fill="url(#shelf-wood)" />
      <rect
        x="10"
        y={SHELF_TOP}
        width="160"
        height="1.5"
        fill="url(#shelf-varnish)"
      />
      {/* Sombra projetada abaixo da prateleira */}
      <rect
        x="14"
        y={SHELF_TOP + 6}
        width="152"
        height="1.5"
        fill="rgba(0, 0, 0, 0.25)"
      />
    </svg>
  );
}
