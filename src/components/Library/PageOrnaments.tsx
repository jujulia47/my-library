/**
 * Floreios decorativos nos cantos das páginas do livro aberto. Inspirado em
 * encadernações barrocas/vitorianas: moldura tripla + scroll volutas
 * preenchidas + folhagem com nervuras + cluster de rosetas + tendrils.
 *
 * Mesmo SVG base (canto superior-esquerdo) "espelhado" via CSS pra cobrir
 * os 4 cantos.
 */

const ORN = "#6B4220"; // marrom escuro principal
const ORN_LIGHT = "#854F0B"; // accent dourado-marrom
const ORN_FILL = "rgba(107, 66, 32, 0.22)"; // sombras de preenchimento

function OrnamentSvg() {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 200 200"
      aria-hidden
      style={{ opacity: 0.78, display: "block" }}
    >
      <g
        stroke={ORN}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* === TRÊS MOLDURAS LINEARES === */}
        <path d="M 10 10 L 200 10" strokeWidth="1.2" />
        <path d="M 10 10 L 10 200" strokeWidth="1.2" />
        <path d="M 18 18 L 200 18" strokeWidth="0.4" />
        <path d="M 18 18 L 18 200" strokeWidth="0.4" />
        <path d="M 24 24 L 200 24" strokeWidth="0.3" opacity="0.6" />
        <path d="M 24 24 L 24 200" strokeWidth="0.3" opacity="0.6" />

        {/* === GRANDE VOLUTA NO VÉRTICE === */}
        {/* Scroll volute principal — preenchido pra dar peso */}
        <path
          d="M 10 10 Q 35 12 44 28 Q 54 46 40 56 Q 26 52 20 40 Q 14 28 10 16 Z"
          fill={ORN_FILL}
          stroke={ORN}
          strokeWidth="0.7"
        />
        {/* Curl interno do volute (contornos) */}
        <path d="M 18 18 Q 32 22 38 32 Q 42 40 34 44 Q 26 40 24 32 Q 22 26 18 18" strokeWidth="0.5" />
        <path d="M 24 26 Q 32 28 34 34" strokeWidth="0.4" opacity="0.7" />

        {/* Olho da espiral central (rosa-de-volute) */}
        <circle cx="14" cy="14" r="3" fill={ORN} />
        <circle cx="14" cy="14" r="1.8" fill={ORN_LIGHT} />
        <circle cx="14" cy="14" r="0.7" fill="#F5E8D0" />

        {/* === CURL SECUNDÁRIO ESCORRENDO PRA DIREITA === */}
        <path
          d="M 44 28 C 56 24 64 30 70 38 Q 76 48 68 52 Q 56 50 50 42"
          strokeWidth="0.6"
        />
        <path
          d="M 56 36 Q 62 32 68 38"
          strokeWidth="0.4"
          opacity="0.7"
        />
        <circle cx="68" cy="40" r="1.6" fill={ORN_LIGHT} />
        <circle cx="68" cy="40" r="0.7" fill={ORN} />

        {/* === CURL SECUNDÁRIO ESCORRENDO PRA BAIXO (espelhado) === */}
        <path
          d="M 28 44 C 24 56 30 64 38 70 Q 48 76 52 68 Q 50 56 42 50"
          strokeWidth="0.6"
        />
        <path
          d="M 36 56 Q 32 62 38 68"
          strokeWidth="0.4"
          opacity="0.7"
        />
        <circle cx="40" cy="68" r="1.6" fill={ORN_LIGHT} />
        <circle cx="40" cy="68" r="0.7" fill={ORN} />

        {/* === FOLHAGEM AO LONGO DA BORDA SUPERIOR === */}
        {/* Cluster de folhas + flor em ~88, 14 */}
        <g transform="translate(80 14)">
          <path
            d="M 0 0 Q 10 -8 22 -2 Q 30 4 26 12 Q 20 16 12 12 Q 4 8 0 0"
            fill={ORN_FILL}
            stroke={ORN}
            strokeWidth="0.5"
          />
          {/* Veia central da folha */}
          <path d="M 0 0 Q 12 4 22 8" strokeWidth="0.4" />
          {/* Veias laterais */}
          <path d="M 5 -2 Q 9 0 12 4" strokeWidth="0.3" opacity="0.6" />
          <path d="M 13 -3 Q 16 1 19 5" strokeWidth="0.3" opacity="0.6" />
          {/* Bolinha decorativa no centro */}
          <circle cx="13" cy="4" r="1.2" fill={ORN_LIGHT} />
        </g>

        {/* Outra folhagem mais simples */}
        <g transform="translate(120 16)">
          <path
            d="M 0 0 Q 8 -6 16 0 Q 18 6 12 8 Q 4 6 0 0 Z"
            fill={ORN_FILL}
            stroke={ORN}
            strokeWidth="0.5"
          />
          <path d="M 0 0 Q 8 2 16 0" strokeWidth="0.35" opacity="0.7" />
          <circle cx="16" cy="2" r="1" fill={ORN_LIGHT} />
        </g>

        {/* Tendril sinuoso pra fechar a borda superior */}
        <path
          d="M 142 16 C 150 10 158 18 162 14 Q 168 10 174 18"
          strokeWidth="0.5"
        />
        <circle cx="162" cy="14" r="1" fill={ORN} />

        {/* === FOLHAGEM AO LONGO DA BORDA ESQUERDA (espelhada) === */}
        <g transform="translate(14 80)">
          <path
            d="M 0 0 Q -8 10 -2 22 Q 4 30 12 26 Q 16 20 12 12 Q 8 4 0 0"
            fill={ORN_FILL}
            stroke={ORN}
            strokeWidth="0.5"
          />
          <path d="M 0 0 Q 4 12 8 22" strokeWidth="0.4" />
          <path d="M -2 5 Q 0 9 4 12" strokeWidth="0.3" opacity="0.6" />
          <path d="M -3 13 Q 1 16 5 19" strokeWidth="0.3" opacity="0.6" />
          <circle cx="4" cy="13" r="1.2" fill={ORN_LIGHT} />
        </g>

        <g transform="translate(16 120)">
          <path
            d="M 0 0 Q -6 8 0 16 Q 6 18 8 12 Q 6 4 0 0 Z"
            fill={ORN_FILL}
            stroke={ORN}
            strokeWidth="0.5"
          />
          <path d="M 0 0 Q 2 8 0 16" strokeWidth="0.35" opacity="0.7" />
          <circle cx="2" cy="16" r="1" fill={ORN_LIGHT} />
        </g>

        <path
          d="M 16 142 C 10 150 18 158 14 162 Q 10 168 18 174"
          strokeWidth="0.5"
        />
        <circle cx="14" cy="162" r="1" fill={ORN} />

        {/* === ROSETA DIAGONAL (entre as duas curls secundárias) === */}
        <g transform="translate(60 60)">
          {/* 4 pétalas em cruz */}
          <ellipse cx="0" cy="-5" rx="2" ry="4" fill={ORN_LIGHT} />
          <ellipse cx="0" cy="5" rx="2" ry="4" fill={ORN_LIGHT} />
          <ellipse cx="-5" cy="0" rx="4" ry="2" fill={ORN_LIGHT} />
          <ellipse cx="5" cy="0" rx="4" ry="2" fill={ORN_LIGHT} />
          {/* Pétalas diagonais menores */}
          <ellipse
            cx="-3.5"
            cy="-3.5"
            rx="1.4"
            ry="3"
            fill={ORN}
            opacity="0.7"
            transform="rotate(-45 -3.5 -3.5)"
          />
          <ellipse
            cx="3.5"
            cy="-3.5"
            rx="1.4"
            ry="3"
            fill={ORN}
            opacity="0.7"
            transform="rotate(45 3.5 -3.5)"
          />
          <ellipse
            cx="-3.5"
            cy="3.5"
            rx="1.4"
            ry="3"
            fill={ORN}
            opacity="0.7"
            transform="rotate(45 -3.5 3.5)"
          />
          <ellipse
            cx="3.5"
            cy="3.5"
            rx="1.4"
            ry="3"
            fill={ORN}
            opacity="0.7"
            transform="rotate(-45 3.5 3.5)"
          />
          {/* Miolo */}
          <circle cx="0" cy="0" r="1.8" fill={ORN} />
          <circle cx="0" cy="0" r="0.8" fill={ORN_LIGHT} />
        </g>

        {/* === Pequenos accents/dots de fechamento === */}
        <circle cx="180" cy="14" r="0.9" fill={ORN} />
        <circle cx="14" cy="180" r="0.9" fill={ORN} />
        <circle cx="50" cy="14" r="0.6" fill={ORN_LIGHT} />
        <circle cx="14" cy="50" r="0.6" fill={ORN_LIGHT} />
      </g>
    </svg>
  );
}

export function PageOrnamentTopLeft() {
  return (
    <span aria-hidden className="page-ornament tl">
      <OrnamentSvg />
    </span>
  );
}

export function PageOrnamentTopRight() {
  return (
    <span aria-hidden className="page-ornament tr">
      <OrnamentSvg />
    </span>
  );
}

export function PageOrnamentBottomLeft() {
  return (
    <span aria-hidden className="page-ornament bl">
      <OrnamentSvg />
    </span>
  );
}

export function PageOrnamentBottomRight() {
  return (
    <span aria-hidden className="page-ornament br">
      <OrnamentSvg />
    </span>
  );
}
