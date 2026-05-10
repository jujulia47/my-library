/**
 * Baú pequeno (refinado). Madeira escura com veios verticais, faixas/cintas
 * de bronze com rebites, fechadura ornamentada com placa em escudo, alças
 * laterais e brilho sutil no arqueamento da tampa.
 */
export function Bau({ width = 108 }: { width?: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height: width * 0.85 }}
    >
      <svg width={width} height={width * 0.85} viewBox="0 0 44 38">
        <defs>
          <linearGradient id="bau-lid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7B5A2A" />
            <stop offset="40%" stopColor="#5A3A20" />
            <stop offset="100%" stopColor="#3D2418" />
          </linearGradient>
          <linearGradient id="bau-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3D2418" />
            <stop offset="100%" stopColor="#1A0F09" />
          </linearGradient>
          <linearGradient id="bau-brass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4B056" />
            <stop offset="50%" stopColor="#A0843E" />
            <stop offset="100%" stopColor="#7B5A2A" />
          </linearGradient>
          <radialGradient id="bau-rivet" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFE0A0" />
            <stop offset="60%" stopColor="#A0843E" />
            <stop offset="100%" stopColor="#5A3A20" />
          </radialGradient>
        </defs>

        {/* Sombra no chão */}
        <ellipse cx="22" cy="37" rx="20" ry="0.9" fill="rgba(0,0,0,0.55)" />

        {/* Tampa arqueada */}
        <path
          d="M 4 16 Q 4 7 22 7 Q 40 7 40 16 L 40 19 L 4 19 Z"
          fill="url(#bau-lid)"
          stroke="#1A0F09"
          strokeWidth="0.5"
        />
        {/* Veios da madeira da tampa */}
        <path d="M 8 12 Q 22 9.5 36 12" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.3" />
        <path d="M 10 15 Q 22 13 34 15" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.25" />
        {/* Highlight do arqueado */}
        <path
          d="M 6 14 Q 22 9 38 14"
          fill="none"
          stroke="rgba(255,224,170,0.25)"
          strokeWidth="0.6"
        />

        {/* Corpo */}
        <rect x="4" y="19" width="36" height="15" fill="url(#bau-body)" stroke="#1A0F09" strokeWidth="0.4" />
        {/* Veios do corpo (verticais) */}
        {[8, 14, 20, 26, 32].map((x) => (
          <line
            key={`g-${x}`}
            x1={x}
            y1="19.5"
            x2={x}
            y2="33.5"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="0.25"
          />
        ))}
        {[11, 17, 23, 29, 35].map((x) => (
          <line
            key={`gh-${x}`}
            x1={x}
            y1="19.5"
            x2={x}
            y2="33.5"
            stroke="rgba(212,176,86,0.12)"
            strokeWidth="0.3"
          />
        ))}

        {/* Cinta superior de bronze (sob a tampa) */}
        <rect x="4" y="18.5" width="36" height="2.4" fill="url(#bau-brass)" />
        {/* Cinta inferior */}
        <rect x="4" y="29" width="36" height="2.4" fill="url(#bau-brass)" />

        {/* Cintas verticais (lateral) */}
        <rect x="6" y="19" width="1.6" height="15" fill="url(#bau-brass)" />
        <rect x="36.4" y="19" width="1.6" height="15" fill="url(#bau-brass)" />

        {/* Rebites — superior */}
        {[7, 13, 19, 25, 31, 37].map((x) => (
          <circle key={`rt-${x}`} cx={x} cy="19.7" r="0.6" fill="url(#bau-rivet)" />
        ))}
        {/* Rebites — inferior */}
        {[7, 13, 19, 25, 31, 37].map((x) => (
          <circle key={`rb-${x}`} cx={x} cy="30.2" r="0.6" fill="url(#bau-rivet)" />
        ))}
        {/* Rebites verticais nas cintas laterais */}
        {[21, 26, 31].map((y) => (
          <circle key={`rl-${y}`} cx="6.8" cy={y} r="0.5" fill="url(#bau-rivet)" />
        ))}
        {[21, 26, 31].map((y) => (
          <circle key={`rr-${y}`} cx="37.2" cy={y} r="0.5" fill="url(#bau-rivet)" />
        ))}

        {/* Placa de fechadura em escudo */}
        <path
          d="M 19 17 L 25 17 Q 26 17 26 18 L 26 25 Q 22 28 22 28 Q 22 28 18 25 L 18 18 Q 18 17 19 17 Z"
          fill="url(#bau-brass)"
          stroke="#3D2418"
          strokeWidth="0.4"
        />
        {/* Detalhe da fechadura */}
        <circle cx="22" cy="22" r="1.2" fill="#3D2418" />
        <rect x="21.7" y="22" width="0.6" height="2" fill="#3D2418" />
        {/* Brilho no escudo */}
        <path d="M 19.6 18.5 L 19.6 24" stroke="rgba(255,224,170,0.7)" strokeWidth="0.3" />

        {/* Alças laterais (correntes pequenas) */}
        <path d="M 4 22 Q 1.5 23.5 4 25" fill="none" stroke="url(#bau-brass)" strokeWidth="1" />
        <path d="M 40 22 Q 42.5 23.5 40 25" fill="none" stroke="url(#bau-brass)" strokeWidth="1" />

        {/* Pés */}
        <rect x="4" y="34" width="6" height="3" fill="#1A0F09" />
        <rect x="34" y="34" width="6" height="3" fill="#1A0F09" />
        <line x1="4" y1="34" x2="10" y2="34" stroke="#A0843E" strokeWidth="0.4" opacity="0.6" />
        <line x1="34" y1="34" x2="40" y2="34" stroke="#A0843E" strokeWidth="0.4" opacity="0.6" />
      </svg>
    </span>
  );
}
