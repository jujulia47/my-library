/**
 * Busto de mármore sobre pedestal (refinado). Cabelo em ondas com mechas
 * definidas, traços faciais sutis (sobrancelhas, olhos com pupila, nariz,
 * lábios), togas com dobras esculpidas, pedestal em coluna com base e
 * capitel, frisos clássicos. Gradiente em mármore com veios discretos.
 */
export function Busto({ width = 78 }: { width?: number }) {
  const height = width * 1.85;
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 56 105"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="bs-marble" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBF5E2" />
            <stop offset="40%" stopColor="#E8DBBE" />
            <stop offset="70%" stopColor="#C4B393" />
            <stop offset="100%" stopColor="#8E7B5E" />
          </linearGradient>
          <linearGradient id="bs-marble-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8C29A" />
            <stop offset="100%" stopColor="#7A6648" />
          </linearGradient>
          <linearGradient id="bs-pedestal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5A3A20" />
            <stop offset="100%" stopColor="#1A0F09" />
          </linearGradient>
          <linearGradient id="bs-pedestal-cap" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7B5A2A" />
            <stop offset="100%" stopColor="#3D2418" />
          </linearGradient>
        </defs>

        {/* Sombra projetada */}
        <ellipse cx="28" cy="102" rx="22" ry="2.2" fill="rgba(0,0,0,0.55)" />

        {/* === Pedestal === */}
        {/* Base larga */}
        <rect x="10" y="98" width="36" height="4" fill="url(#bs-pedestal-cap)" />
        <rect x="8" y="100" width="40" height="2.5" fill="#1A0F09" />
        {/* Coluna */}
        <rect x="14" y="80" width="28" height="18" fill="url(#bs-pedestal)" />
        {/* Frisos verticais (estrias da coluna) */}
        {[18, 22, 26, 30, 34, 38].map((x) => (
          <line
            key={`flute-${x}`}
            x1={x}
            y1="80"
            x2={x}
            y2="98"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="0.3"
          />
        ))}
        {[20, 24, 28, 32, 36].map((x) => (
          <line
            key={`flute-h-${x}`}
            x1={x}
            y1="80"
            x2={x}
            y2="98"
            stroke="rgba(212,176,86,0.18)"
            strokeWidth="0.3"
          />
        ))}
        {/* Capitel (top do pedestal) */}
        <rect x="11" y="76" width="34" height="5" fill="url(#bs-pedestal-cap)" />
        <rect x="9" y="74" width="38" height="3" fill="#3D2418" />
        {/* Friso clássico (greca) */}
        <rect x="12" y="77" width="32" height="2.5" fill="#5A3A20" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={`gk-${i}`}
            x={13 + i * 4}
            y="77.6"
            width="2"
            height="1.4"
            fill="#A0843E"
          />
        ))}

        {/* === Busto === */}
        {/* Toga / ombros — base ampla */}
        <path
          d="M 8 76 Q 8 58 16 56 Q 22 54 28 54 Q 34 54 40 56 Q 48 58 48 76 Z"
          fill="url(#bs-marble)"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.5"
        />
        {/* Dobras da toga (esquerda) */}
        <path d="M 12 64 Q 14 70 12 76" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
        <path d="M 16 60 Q 18 68 17 76" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" />
        {/* Dobras da toga (direita) */}
        <path d="M 44 64 Q 42 70 44 76" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
        <path d="M 40 60 Q 38 68 39 76" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" />
        {/* Vinco central (V da toga) */}
        <path
          d="M 22 56 L 28 64 L 34 56"
          fill="url(#bs-marble-shadow)"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="0.4"
        />

        {/* Pescoço */}
        <path
          d="M 22 50 Q 22 56 28 56 Q 34 56 34 50 L 34 44 L 22 44 Z"
          fill="url(#bs-marble)"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.4"
        />
        {/* Sombra debaixo do queixo */}
        <ellipse cx="28" cy="46" rx="6" ry="1.6" fill="rgba(0,0,0,0.18)" />

        {/* Cabeça — formato mais natural */}
        <path
          d="M 14 32 Q 14 14 28 14 Q 42 14 42 32 Q 42 42 38 46 Q 35 50 28 50 Q 21 50 18 46 Q 14 42 14 32 Z"
          fill="url(#bs-marble)"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="0.5"
        />
        {/* Veios sutis no mármore */}
        <path d="M 18 26 Q 24 22 30 26" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.3" />
        <path d="M 32 36 Q 36 38 38 36" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3" />

        {/* Cabelo / mechas onduladas (estilo greco-romano) */}
        <path
          d="M 12 30 Q 12 12 28 11 Q 44 12 44 30 Q 42 26 38 26 Q 36 22 32 24 Q 28 20 24 24 Q 20 22 18 26 Q 14 26 12 30 Z"
          fill="#9D8C73"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.4"
        />
        {/* Detalhes nas mechas (cachos) */}
        <path d="M 16 22 Q 18 18 20 22" fill="none" stroke="#7A6648" strokeWidth="0.5" />
        <path d="M 22 18 Q 24 14 26 18" fill="none" stroke="#7A6648" strokeWidth="0.5" />
        <path d="M 28 18 Q 30 14 32 18" fill="none" stroke="#7A6648" strokeWidth="0.5" />
        <path d="M 34 20 Q 36 16 38 20" fill="none" stroke="#7A6648" strokeWidth="0.5" />
        <path d="M 14 28 Q 16 26 18 28" fill="none" stroke="#7A6648" strokeWidth="0.4" />
        <path d="M 38 28 Q 40 26 42 28" fill="none" stroke="#7A6648" strokeWidth="0.4" />
        {/* Costeleta (lateral) */}
        <path d="M 14 32 Q 13 36 15 38" fill="#9D8C73" />
        <path d="M 42 32 Q 43 36 41 38" fill="#9D8C73" />

        {/* Sobrancelhas */}
        <path d="M 19 32 Q 21.5 31 23 32.5" fill="none" stroke="#3D2418" strokeWidth="0.5" opacity="0.7" />
        <path d="M 33 32.5 Q 34.5 31 37 32" fill="none" stroke="#3D2418" strokeWidth="0.5" opacity="0.7" />

        {/* Olhos */}
        <ellipse cx="21.5" cy="35" rx="1.4" ry="0.7" fill="#FBF5E2" />
        <ellipse cx="34.5" cy="35" rx="1.4" ry="0.7" fill="#FBF5E2" />
        <circle cx="21.5" cy="35" r="0.45" fill="#3D2418" />
        <circle cx="34.5" cy="35" r="0.45" fill="#3D2418" />
        {/* Brilho dos olhos */}
        <circle cx="21.7" cy="34.85" r="0.16" fill="#FFFFFF" />
        <circle cx="34.7" cy="34.85" r="0.16" fill="#FFFFFF" />

        {/* Nariz */}
        <path
          d="M 28 36 L 27 41 L 28 42 L 29 41 Z"
          fill="rgba(0,0,0,0.18)"
        />
        <line x1="28" y1="36" x2="28" y2="41" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3" />

        {/* Lábios */}
        <path d="M 25 44 Q 28 45.5 31 44" fill="none" stroke="#9D6B4A" strokeWidth="0.5" opacity="0.7" />
        <path d="M 26 44.6 Q 28 44 30 44.6" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.3" />

        {/* Highlight no rosto (lateral esquerda) */}
        <path
          d="M 16 30 Q 18 36 18 44"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="0.6"
        />
        {/* Sombra (lateral direita) */}
        <path
          d="M 40 30 Q 38 36 38 44"
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="1.2"
        />
      </svg>
    </span>
  );
}
