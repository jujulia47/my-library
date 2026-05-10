/**
 * Lamparina a óleo decorativa (refinada). Reservatório bojudo de vidro com
 * óleo ambar, mecha visível, queimador de bronze polido, chimney curva e
 * alça lateral. Halo radial discreto pulsando.
 */
export function Lamparina({ width = 94 }: { width?: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height: width * 1.5 }}
    >
      <svg width={width} height={width * 1.5} viewBox="0 0 40 60" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="lamp-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 218, 130, 0.55)" />
            <stop offset="60%" stopColor="rgba(160, 132, 62, 0.2)" />
            <stop offset="100%" stopColor="rgba(160, 132, 62, 0)" />
          </radialGradient>
          <linearGradient id="lamp-brass" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5A3A20" />
            <stop offset="40%" stopColor="#A0843E" />
            <stop offset="70%" stopColor="#D4B056" />
            <stop offset="100%" stopColor="#7B5A2A" />
          </linearGradient>
          <radialGradient id="lamp-glass" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(255, 235, 180, 0.85)" />
            <stop offset="60%" stopColor="rgba(212, 176, 86, 0.5)" />
            <stop offset="100%" stopColor="rgba(140, 95, 40, 0.45)" />
          </radialGradient>
          <linearGradient id="lamp-chimney" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(245, 232, 208, 0.15)" />
            <stop offset="40%" stopColor="rgba(245, 232, 208, 0.55)" />
            <stop offset="100%" stopColor="rgba(160, 132, 62, 0.35)" />
          </linearGradient>
          <linearGradient id="lamp-flame" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="55%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#BC6E48" />
          </linearGradient>
        </defs>

        {/* Halo radial */}
        <ellipse
          cx="20"
          cy="18"
          rx="22"
          ry="18"
          fill="url(#lamp-halo)"
          className="halo-pulse"
        />

        {/* Sombra na base */}
        <ellipse cx="20" cy="57" rx="14" ry="1.6" fill="rgba(0,0,0,0.45)" />

        {/* Base — pé bojudo */}
        <ellipse cx="20" cy="54.5" rx="13" ry="2.6" fill="url(#lamp-brass)" />
        <path d="M 9 54 Q 9 50 13 49 L 27 49 Q 31 50 31 54 Z" fill="url(#lamp-brass)" />
        <ellipse cx="20" cy="49" rx="7" ry="1.3" fill="#7B5A2A" />
        <ellipse cx="20" cy="48.6" rx="6" ry="0.9" fill="#D4B056" opacity="0.55" />

        {/* Coluna conectora */}
        <path d="M 17 48 L 16.6 44 L 23.4 44 L 23 48 Z" fill="url(#lamp-brass)" />
        <rect x="15.5" y="42" width="9" height="2.5" rx="0.6" fill="#7B5A2A" />

        {/* Reservatório de vidro — bojudo */}
        <path
          d="M 11 42 Q 9 36 11 31 Q 13 27 20 27 Q 27 27 29 31 Q 31 36 29 42 Z"
          fill="url(#lamp-glass)"
          stroke="rgba(160, 132, 62, 0.55)"
          strokeWidth="0.6"
        />
        {/* Reflexo no vidro (esquerda) */}
        <path
          d="M 13 32 Q 12 36 13 40"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.9"
        />
        {/* Brilho pequeno (alto direito) */}
        <ellipse cx="26" cy="30" rx="1.6" ry="2" fill="rgba(255,255,255,0.4)" />

        {/* Linha do nível de óleo */}
        <path
          d="M 11.4 38 Q 20 39.2 28.6 38"
          fill="none"
          stroke="rgba(140, 80, 30, 0.5)"
          strokeWidth="0.4"
        />

        {/* Queimador / colar de bronze */}
        <rect x="14" y="23" width="12" height="4.5" rx="0.8" fill="url(#lamp-brass)" />
        <line x1="14" y1="25" x2="26" y2="25" stroke="#D4B056" strokeWidth="0.4" opacity="0.7" />
        <line x1="14" y1="26.4" x2="26" y2="26.4" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3" />
        {/* Parafuso lateral do queimador */}
        <circle cx="13.8" cy="25.2" r="0.7" fill="#3D2418" />

        {/* Mecha (visível antes do chimney) */}
        <rect x="19" y="20" width="2" height="3.4" fill="#9D8C73" />

        {/* Chimney de vidro */}
        <path
          d="M 15 22 Q 14 14 16 8 Q 17 6 20 6 Q 23 6 24 8 Q 26 14 25 22 Z"
          fill="url(#lamp-chimney)"
          stroke="rgba(160, 132, 62, 0.55)"
          strokeWidth="0.5"
        />
        {/* Reflexo no chimney */}
        <path
          d="M 17 10 Q 16.4 14 17 20"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="0.6"
        />

        {/* Chama dentro do chimney */}
        <g className="flame-flicker" style={{ transformOrigin: "20px 20px" }}>
          <path
            d="M 20 20 Q 22.6 16 21.6 11 Q 20.6 13 20 11.4 Q 19.4 13 18.4 11 Q 17.4 16 20 20 Z"
            fill="url(#lamp-flame)"
          />
          <ellipse cx="20" cy="14" rx="0.6" ry="2" fill="rgba(255,255,255,0.85)" />
        </g>

        {/* Tampinha do chimney (anel superior) */}
        <ellipse cx="20" cy="6.4" rx="4" ry="0.9" fill="url(#lamp-brass)" />
        <ellipse cx="20" cy="6" rx="3.2" ry="0.5" fill="#3D2418" opacity="0.6" />

        {/* Alça lateral */}
        <path
          d="M 28.5 30 Q 35 30 34 36 Q 33.4 38 31 37"
          fill="none"
          stroke="url(#lamp-brass)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M 28.5 30 Q 35 30 34 36 Q 33.4 38 31 37"
          fill="none"
          stroke="rgba(255,224,170,0.5)"
          strokeWidth="0.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
