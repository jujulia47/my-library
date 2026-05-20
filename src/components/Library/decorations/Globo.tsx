/**
 * Globo terrestre vintage com base de madeira (refinado). Esfera com gradiente
 * radial pra dar volume, continentes mais detalhados (formato sugerindo África,
 * Américas, Eurásia), latitudes/longitudes esquemáticas, anel meridiano em
 * bronze polido, base com colunas torneadas e plataforma circular.
 * Rotação contínua via classe `globe-rotate`. `prefers-reduced-motion` neutraliza no CSS.
 */
export function Globo({ width = 92 }: { width?: number }) {
  const height = width * 1.3;
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 70 90"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id="gl-sphere" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#3F6FA5" />
            <stop offset="55%" stopColor="#1E3A5F" />
            <stop offset="100%" stopColor="#0A1830" />
          </radialGradient>
          <linearGradient id="gl-brass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4B056" />
            <stop offset="50%" stopColor="#A0843E" />
            <stop offset="100%" stopColor="#5A3A20" />
          </linearGradient>
          <linearGradient id="gl-wood-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7B5A2A" />
            <stop offset="100%" stopColor="#3D2418" />
          </linearGradient>
          <linearGradient id="gl-wood-light" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A0843E" />
            <stop offset="100%" stopColor="#5A3A20" />
          </linearGradient>
        </defs>

        {/* Sombra projetada */}
        <ellipse cx="35" cy="83" rx="22" ry="2" fill="rgba(0,0,0,0.5)" />

        {/* Anel meridiano de bronze (atrás) */}
        <ellipse
          cx="35"
          cy="38"
          rx="25"
          ry="25"
          fill="none"
          stroke="url(#gl-brass)"
          strokeWidth="2.4"
        />
        {/* Marcas em graus no meridiano — arredondado pra 4 casas pra evitar
            hydration mismatch (Math.cos/sin têm precisão diferente entre
            Node SSR e V8 client). */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const r = 25;
          const cx = Number(
            (35 + Math.cos((deg * Math.PI) / 180) * r).toFixed(4),
          );
          const cy = Number(
            (38 + Math.sin((deg * Math.PI) / 180) * r).toFixed(4),
          );
          return <circle key={deg} cx={cx} cy={cy} r="0.5" fill="#3D2418" />;
        })}

        {/* Esfera — rotaciona em torno do próprio centro (fill-box). */}
        <g className="globe-rotate" style={{ transformOrigin: "center" }}>
          {/* Globo */}
          <circle
            cx="35"
            cy="38"
            r="22"
            fill="url(#gl-sphere)"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="0.5"
          />

          {/* Latitudes (paralelos) — rx arredondado pra evitar hydration
              mismatch (Math.sqrt diverge nos últimos dígitos entre Node/V8). */}
          {[18, 26, 38, 50, 58].map((y) => (
            <ellipse
              key={`lat-${y}`}
              cx="35"
              cy={y}
              rx={Number(
                Math.sqrt(22 * 22 - (y - 38) * (y - 38)).toFixed(4),
              )}
              ry="0.6"
              fill="none"
              stroke="rgba(212,176,86,0.22)"
              strokeWidth="0.3"
            />
          ))}
          {/* Linha do equador (mais forte) */}
          <line
            x1="13"
            y1="38"
            x2="57"
            y2="38"
            stroke="rgba(212,176,86,0.55)"
            strokeWidth="0.45"
          />

          {/* Continente — América (esquerda) */}
          <path
            d="M 18 26 Q 22 24 24 28 Q 25 33 22 36 Q 20 38 21 42 Q 23 46 21 50 Q 18 52 17 48 Q 15 42 16 36 Q 17 30 18 26 Z"
            fill="#7E9C5E"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.3"
          />
          {/* Detalhe (península) */}
          <path d="M 22 32 Q 25 32 24 35" fill="#5C6E47" />

          {/* Continente — África/Eurásia central */}
          <path
            d="M 30 22 Q 38 20 44 24 Q 48 28 47 32 Q 45 36 42 34 Q 40 38 42 44 Q 40 50 36 48 Q 32 46 31 40 Q 30 32 30 22 Z"
            fill="#A0843E"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.3"
          />
          {/* Sombra interna pra dar dimensão */}
          <path
            d="M 32 28 Q 38 26 42 30 Q 40 32 36 30 Z"
            fill="rgba(0,0,0,0.18)"
          />

          {/* Continente — Ásia/Oceania */}
          <path
            d="M 47 30 Q 53 30 56 34 Q 54 38 51 36 Q 49 38 50 42 Q 47 42 47 30 Z"
            fill="#7E9C5E"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.3"
          />
          {/* Ilhas */}
          <ellipse cx="50" cy="46" rx="1.6" ry="0.8" fill="#7E9C5E" />
          <ellipse cx="46" cy="48" rx="1" ry="0.6" fill="#7E9C5E" />

          {/* Calota polar norte */}
          <ellipse cx="35" cy="17.5" rx="6" ry="1.6" fill="#F5E8D0" opacity="0.85" />
          {/* Calota polar sul */}
          <ellipse cx="35" cy="58.6" rx="6" ry="1.6" fill="#F5E8D0" opacity="0.85" />

          {/* Brilho esférico */}
          <ellipse
            cx="27"
            cy="28"
            rx="6"
            ry="4"
            fill="rgba(255,255,255,0.18)"
          />
        </g>

        {/* Anel meridiano (frente sobreposto) */}
        <ellipse
          cx="35"
          cy="38"
          rx="6"
          ry="22"
          fill="none"
          stroke="url(#gl-brass)"
          strokeWidth="1.6"
        />
        {/* Eixo de rotação visível */}
        <line x1="35" y1="14" x2="35" y2="16" stroke="#3D2418" strokeWidth="1.2" />
        <line x1="35" y1="60" x2="35" y2="64" stroke="#3D2418" strokeWidth="1.2" />
        {/* Parafuso de fixação no topo */}
        <circle cx="35" cy="13.6" r="1.2" fill="url(#gl-brass)" />
        <circle cx="35" cy="13.6" r="0.5" fill="#3D2418" />

        {/* Pivô inferior do meridiano */}
        <circle cx="35" cy="63" r="1.6" fill="url(#gl-brass)" />
        <circle cx="35" cy="63" r="0.6" fill="#3D2418" />

        {/* Coluna torneada vertical — base */}
        <rect x="33.5" y="64" width="3" height="6" fill="url(#gl-wood-dark)" />
        <ellipse cx="35" cy="70" rx="4" ry="1.2" fill="url(#gl-wood-light)" />
        <rect x="32" y="70" width="6" height="2" fill="url(#gl-wood-dark)" />

        {/* Plataforma redonda inferior */}
        <ellipse cx="35" cy="73.5" rx="14" ry="2.2" fill="url(#gl-wood-light)" />
        <ellipse cx="35" cy="74.5" rx="14" ry="2" fill="url(#gl-wood-dark)" />
        {/* Aro decorativo */}
        <ellipse cx="35" cy="74.4" rx="13.4" ry="1.7" fill="none" stroke="#A0843E" strokeWidth="0.4" />
        {/* Veios */}
        <path d="M 22 76 Q 35 75.5 48 76" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.3" />

        {/* Pés */}
        <rect x="22" y="76" width="3" height="3" fill="#3D2418" />
        <rect x="35" y="76" width="3" height="3" fill="#3D2418" />
        <rect x="45" y="76" width="3" height="3" fill="#3D2418" />
      </svg>
    </span>
  );
}
