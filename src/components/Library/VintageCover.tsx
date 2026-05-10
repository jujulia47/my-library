import { spineHexForBookId } from "@/utils/spineColors";

type Size = "spine-to-cover" | "open-cover" | "spread-cover";

type Props = {
  bookId: string;
  title: string;
  size?: Size;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Capa vintage do contexto `/library` (sessões 17.7 → 17.10).
 *
 * Sessão 17.10: 3 variantes selecionadas determinísticamente pelo hash do
 * `bookId` — cada livro tem o "estilo de capa" sorteado, mas estável entre
 * renders. Cada variante sobrepõe ornamentos diferentes em cima da base
 * comum (cor + textura de couro + título centralizado):
 *
 *   - **heraldic** (A): cartouche barroco com 3 molduras concêntricas,
 *     fleurons nos 4 cantos, flourishes ao redor do título, emblema
 *     central inferior. Estilo "livro de tribunal".
 *   - **botanical** (B): vinhas douradas saindo dos 4 cantos e subindo
 *     pra dentro, com pequenas rosetas nas pontas. Moldura simples
 *     dupla. Estilo "encadernação Art Nouveau".
 *   - **architectural** (C): moldura retangular grossa, frontão com
 *     coroinha no topo, pedestal embaixo, colunas laterais sutis,
 *     título no centro. Estilo "frontispício clássico".
 */
export function VintageCover({
  bookId,
  title,
  size = "spine-to-cover",
  className,
  style,
}: Props) {
  const hex = spineHexForBookId(bookId);
  const variant = pickVariant(bookId);

  const fontSize =
    size === "spread-cover" ? 22 : size === "open-cover" ? 24 : 18;

  return (
    <div
      className={`vintage-cover vintage-cover-${variant} ${className ?? ""}`}
      style={{
        background: `linear-gradient(135deg, ${lighten(hex, 8)} 0%, ${hex} 35%, ${darken(hex, 28)} 100%)`,
        ...style,
      }}
    >
      {/* Camada de textura de couro via CSS ::before */}

      {variant === "heraldic" && <HeraldicLayer />}
      {variant === "botanical" && <BotanicalLayer />}
      {variant === "architectural" && <ArchitecturalLayer />}

      {/* Bloco do título — comum aos 3 estilos, mas a variante adiciona
          ornamentação ao redor. */}
      <div className="vintage-cover-title-block">
        <h2 className="vintage-cover-title" style={{ fontSize }}>
          {title}
        </h2>
      </div>
    </div>
  );
}

function pickVariant(
  bookId: string,
): "heraldic" | "botanical" | "architectural" {
  let hash = 0;
  for (let i = 0; i < bookId.length; i += 1) {
    hash = (hash * 31 + bookId.charCodeAt(i)) | 0;
  }
  const variants = ["heraldic", "botanical", "architectural"] as const;
  return variants[Math.abs(hash) % variants.length];
}

/* =====================================================================
   VARIANTE A — HERALDIC (cartouche barroco)
   ===================================================================== */
function HeraldicLayer() {
  return (
    <>
      <span aria-hidden className="vintage-cover-frame outer" />
      <span aria-hidden className="vintage-cover-frame mid" />
      <span aria-hidden className="vintage-cover-frame inner" />

      <CornerFleuron pos="tl" />
      <CornerFleuron pos="tr" />
      <CornerFleuron pos="bl" />
      <CornerFleuron pos="br" />

      <TitleFlourish position="top" />
      <TitleFlourish position="bottom" />
      <CenterEmblem />
    </>
  );
}

function CornerFleuron({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const rotation = { tl: 0, tr: 90, br: 180, bl: 270 }[pos];
  return (
    <span
      aria-hidden
      className={`vintage-cover-corner ${pos}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <svg viewBox="0 0 36 36" width="100%" height="100%">
        <line x1="2" y1="6" x2="28" y2="6" stroke="#D4B056" strokeWidth="0.7" />
        <line x1="6" y1="2" x2="6" y2="28" stroke="#D4B056" strokeWidth="0.7" />
        <path
          d="M 6 6 Q 14 8 18 14 Q 16 12 12 12 Q 10 10 6 10"
          fill="none"
          stroke="#D4B056"
          strokeWidth="0.5"
        />
        <path
          d="M 6 6 Q 8 14 14 18 Q 12 16 12 12 Q 10 10 10 6"
          fill="none"
          stroke="#D4B056"
          strokeWidth="0.5"
        />
        <path
          d="M 12 12 Q 16 10 20 14 Q 18 18 14 16 Q 12 14 12 12 Z"
          fill="#A0843E"
        />
        <path
          d="M 12 12 Q 14 16 18 20 Q 14 18 14 14 Q 12 14 12 12 Z"
          fill="#A0843E"
          opacity="0.85"
        />
        <circle cx="6" cy="6" r="2.2" fill="#3D2418" />
        <circle cx="6" cy="6" r="1.4" fill="#A0843E" />
        <circle cx="6" cy="6" r="0.5" fill="#F0D080" />
      </svg>
    </span>
  );
}

function TitleFlourish({ position }: { position: "top" | "bottom" }) {
  return (
    <span
      aria-hidden
      className={`vintage-cover-flourish ${position}`}
      style={position === "bottom" ? { transform: "rotate(180deg)" } : undefined}
    >
      <svg viewBox="0 0 120 16" width="100%" height="16">
        <line x1="4" y1="8" x2="40" y2="8" stroke="#D4B056" strokeWidth="0.7" />
        <line x1="80" y1="8" x2="116" y2="8" stroke="#D4B056" strokeWidth="0.7" />
        <path
          d="M 40 8 Q 46 4 52 8 Q 58 12 60 8"
          fill="none"
          stroke="#D4B056"
          strokeWidth="0.5"
        />
        <path
          d="M 60 8 Q 62 12 68 8 Q 74 4 80 8"
          fill="none"
          stroke="#D4B056"
          strokeWidth="0.5"
        />
        <polygon
          points="60,3 64,8 60,13 56,8"
          fill="#A0843E"
          stroke="#3D2418"
          strokeWidth="0.3"
        />
        <circle cx="60" cy="8" r="1" fill="#F0D080" />
        <circle cx="42" cy="8" r="0.6" fill="#D4B056" />
        <circle cx="78" cy="8" r="0.6" fill="#D4B056" />
      </svg>
    </span>
  );
}

function CenterEmblem() {
  return (
    <span aria-hidden className="vintage-cover-emblem">
      <svg viewBox="0 0 40 40" width="100%" height="100%">
        <ellipse cx="20" cy="11" rx="3" ry="6.5" fill="#A0843E" />
        <ellipse cx="20" cy="29" rx="3" ry="6.5" fill="#A0843E" />
        <ellipse cx="11" cy="20" rx="6.5" ry="3" fill="#A0843E" />
        <ellipse cx="29" cy="20" rx="6.5" ry="3" fill="#A0843E" />
        <circle cx="20" cy="20" r="3" fill="#3D2418" />
        <circle cx="20" cy="20" r="1.8" fill="#A0843E" />
        <circle cx="20" cy="20" r="0.6" fill="#F0D080" />
      </svg>
    </span>
  );
}

/* =====================================================================
   VARIANTE B — BOTANICAL (vinhas douradas saindo dos cantos)
   ===================================================================== */
function BotanicalLayer() {
  return (
    <>
      {/* Moldura dupla simples */}
      <span aria-hidden className="vintage-cover-frame outer" />
      <span aria-hidden className="vintage-cover-frame inner" />

      {/* SVG full-cover com vinhas saindo dos 4 cantos */}
      <svg
        aria-hidden
        className="vintage-cover-botanical-svg"
        viewBox="0 0 200 280"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="vine-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F0D080" />
            <stop offset="60%" stopColor="#A0843E" />
            <stop offset="100%" stopColor="#5A3A20" />
          </linearGradient>
        </defs>

        {/* Vinha canto superior esquerdo */}
        <VineCorner cx={18} cy={20} flip="none" />
        {/* Vinha canto superior direito */}
        <VineCorner cx={182} cy={20} flip="x" />
        {/* Vinha canto inferior esquerdo */}
        <VineCorner cx={18} cy={260} flip="y" />
        {/* Vinha canto inferior direito */}
        <VineCorner cx={182} cy={260} flip="xy" />
      </svg>
    </>
  );
}

function VineCorner({
  cx,
  cy,
  flip,
}: {
  cx: number;
  cy: number;
  flip: "none" | "x" | "y" | "xy";
}) {
  // Aplica espelhamento via transform composto
  const sx = flip === "x" || flip === "xy" ? -1 : 1;
  const sy = flip === "y" || flip === "xy" ? -1 : 1;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${sx} ${sy})`}>
      {/* Caule principal */}
      <path
        d="M 0 0 Q 8 30 24 50 Q 36 64 56 76"
        fill="none"
        stroke="url(#vine-gold)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Galhos secundários */}
      <path
        d="M 6 20 Q 16 22 22 14"
        fill="none"
        stroke="url(#vine-gold)"
        strokeWidth="0.8"
      />
      <path
        d="M 14 38 Q 28 38 36 30"
        fill="none"
        stroke="url(#vine-gold)"
        strokeWidth="0.8"
      />
      <path
        d="M 28 56 Q 42 56 50 48"
        fill="none"
        stroke="url(#vine-gold)"
        strokeWidth="0.8"
      />
      {/* Folhas (gotinhas douradas) */}
      <ellipse
        cx="22"
        cy="14"
        rx="3"
        ry="1.5"
        fill="#A0843E"
        transform="rotate(-30 22 14)"
      />
      <ellipse
        cx="36"
        cy="30"
        rx="3.5"
        ry="1.6"
        fill="#A0843E"
        transform="rotate(-25 36 30)"
      />
      <ellipse
        cx="50"
        cy="48"
        rx="3"
        ry="1.5"
        fill="#A0843E"
        transform="rotate(-20 50 48)"
      />
      <ellipse
        cx="56"
        cy="76"
        rx="3"
        ry="1.4"
        fill="#A0843E"
        transform="rotate(-15 56 76)"
      />
      {/* Rosinhas (botões) */}
      <circle cx="22" cy="14" r="1.5" fill="#D4B056" />
      <circle cx="22" cy="14" r="0.7" fill="#5A3A20" />
      <circle cx="36" cy="30" r="1.7" fill="#D4B056" />
      <circle cx="36" cy="30" r="0.8" fill="#5A3A20" />
      <circle cx="50" cy="48" r="1.4" fill="#D4B056" />
      <circle cx="50" cy="48" r="0.6" fill="#5A3A20" />
      <circle cx="56" cy="76" r="1.6" fill="#D4B056" />
      <circle cx="56" cy="76" r="0.7" fill="#5A3A20" />
      {/* Pequenos detalhes (botõezinhos) */}
      <circle cx="14" cy="38" r="0.8" fill="#A0843E" />
      <circle cx="28" cy="56" r="0.8" fill="#A0843E" />
    </g>
  );
}

/* =====================================================================
   VARIANTE C — ARCHITECTURAL (frontão clássico)
   ===================================================================== */
function ArchitecturalLayer() {
  return (
    <>
      <span aria-hidden className="vintage-cover-frame outer" />
      <span aria-hidden className="vintage-cover-frame mid" />

      {/* Frontão (top pediment) */}
      <svg
        aria-hidden
        className="vintage-cover-pediment top"
        viewBox="0 0 120 36"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Coroa central */}
        <path
          d="M 50 20 L 54 12 L 58 18 L 62 10 L 66 18 L 70 12 L 74 20 Z"
          fill="#A0843E"
          stroke="#3D2418"
          strokeWidth="0.5"
        />
        <circle cx="54" cy="12" r="0.9" fill="#F0D080" />
        <circle cx="62" cy="10" r="1" fill="#F0D080" />
        <circle cx="70" cy="12" r="0.9" fill="#F0D080" />
        <line x1="50" y1="22" x2="74" y2="22" stroke="#3D2418" strokeWidth="0.5" />
        {/* Volutas laterais */}
        <path
          d="M 14 22 Q 22 18 30 22 Q 36 26 40 22 Q 44 18 50 22"
          fill="none"
          stroke="#A0843E"
          strokeWidth="0.7"
        />
        <path
          d="M 74 22 Q 80 18 84 22 Q 88 26 94 22 Q 102 18 110 22"
          fill="none"
          stroke="#A0843E"
          strokeWidth="0.7"
        />
        <circle cx="22" cy="22" r="0.8" fill="#A0843E" />
        <circle cx="40" cy="22" r="0.8" fill="#A0843E" />
        <circle cx="84" cy="22" r="0.8" fill="#A0843E" />
        <circle cx="102" cy="22" r="0.8" fill="#A0843E" />
        {/* Linha base do frontão */}
        <line x1="10" y1="30" x2="110" y2="30" stroke="#D4B056" strokeWidth="0.6" />
      </svg>

      {/* Pedestal (base) */}
      <svg
        aria-hidden
        className="vintage-cover-pediment bottom"
        viewBox="0 0 120 36"
        preserveAspectRatio="xMidYMid meet"
      >
        <line x1="10" y1="6" x2="110" y2="6" stroke="#D4B056" strokeWidth="0.6" />
        {/* Greca clássica */}
        <rect x="14" y="10" width="92" height="6" fill="none" stroke="#A0843E" strokeWidth="0.4" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <rect
            key={i}
            x={16 + i * 10}
            y="11"
            width="6"
            height="4"
            fill="none"
            stroke="#A0843E"
            strokeWidth="0.35"
          />
        ))}
        {/* Emblema central inferior */}
        <circle cx="60" cy="26" r="3" fill="#A0843E" stroke="#3D2418" strokeWidth="0.4" />
        <circle cx="60" cy="26" r="1.6" fill="#3D2418" />
        <circle cx="60" cy="26" r="0.6" fill="#F0D080" />
        <line x1="48" y1="26" x2="56" y2="26" stroke="#A0843E" strokeWidth="0.4" />
        <line x1="64" y1="26" x2="72" y2="26" stroke="#A0843E" strokeWidth="0.4" />
      </svg>

      {/* Colunas sutis nas laterais (inset 2 frisos verticais) */}
      <span aria-hidden className="vintage-cover-column left" />
      <span aria-hidden className="vintage-cover-column right" />
    </>
  );
}

/* =====================================================================
   Helpers de cor
   ===================================================================== */
function darken(hex: string, percent: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const factor = 1 - percent / 100;
  return rgbToHex(
    Math.max(0, Math.round(r * factor)),
    Math.max(0, Math.round(g * factor)),
    Math.max(0, Math.round(b * factor)),
  );
}

function lighten(hex: string, percent: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const factor = percent / 100;
  return rgbToHex(
    Math.min(255, Math.round(r + (255 - r) * factor)),
    Math.min(255, Math.round(g + (255 - g) * factor)),
    Math.min(255, Math.round(b + (255 - b) * factor)),
  );
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
