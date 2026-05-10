/**
 * Vaso decorativo de cerâmica antiga (refinado). Forma anforal com gargalo
 * estreito e alças laterais (estilo grego), padrão de meandros (greca) na
 * faixa principal, friso de palmetas dourado, base e boca em cerâmica
 * escura, brilhos e sombras pra sensação esférica.
 */
export function Vaso({ width = 72 }: { width?: number }) {
  const height = width * 1.8;
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height }}
    >
      <svg width={width} height={height} viewBox="0 0 50 90">
        <defs>
          <radialGradient id="vs-body" cx="35%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#D4845D" />
            <stop offset="40%" stopColor="#BC6E48" />
            <stop offset="80%" stopColor="#874028" />
            <stop offset="100%" stopColor="#4F2510" />
          </radialGradient>
          <linearGradient id="vs-neck" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#874028" />
            <stop offset="50%" stopColor="#BC6E48" />
            <stop offset="100%" stopColor="#5A3A20" />
          </linearGradient>
          <linearGradient id="vs-rim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3D2418" />
            <stop offset="100%" stopColor="#1A0F09" />
          </linearGradient>
        </defs>

        {/* Sombra projetada */}
        <ellipse cx="25" cy="86" rx="22" ry="2.2" fill="rgba(0,0,0,0.5)" />

        {/* Pé do vaso */}
        <path
          d="M 18 86 L 14 80 L 36 80 L 32 86 Z"
          fill="url(#vs-rim)"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.4"
        />
        {/* Aro de bronze no pé */}
        <line x1="14" y1="80.5" x2="36" y2="80.5" stroke="#A0843E" strokeWidth="0.5" opacity="0.7" />

        {/* Corpo principal — anforal */}
        <path
          d="M 14 80 Q 6 60 8 42 Q 10 28 16 24 L 34 24 Q 40 28 42 42 Q 44 60 36 80 Z"
          fill="url(#vs-body)"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.6"
        />

        {/* Alça esquerda */}
        <path
          d="M 9.5 40 Q 4 38 4 50 Q 4 58 10 56"
          fill="none"
          stroke="#874028"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 9.5 40 Q 4 38 4 50 Q 4 58 10 56"
          fill="none"
          stroke="rgba(255,224,170,0.4)"
          strokeWidth="0.6"
          strokeLinecap="round"
        />
        {/* Alça direita */}
        <path
          d="M 40.5 40 Q 46 38 46 50 Q 46 58 40 56"
          fill="none"
          stroke="#874028"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 40.5 40 Q 46 38 46 50 Q 46 58 40 56"
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.5"
          strokeLinecap="round"
        />

        {/* Pescoço */}
        <path
          d="M 16 24 Q 16 18 18 14 L 32 14 Q 34 18 34 24 Z"
          fill="url(#vs-neck)"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="0.5"
        />

        {/* Boca / aro superior */}
        <ellipse cx="25" cy="13.5" rx="10" ry="2.4" fill="url(#vs-rim)" />
        <ellipse cx="25" cy="13" rx="10" ry="2.2" fill="#5A3A20" />
        <ellipse cx="25" cy="12.6" rx="8.4" ry="1.6" fill="#1A0F09" />
        <ellipse cx="25" cy="12.4" rx="6" ry="0.8" fill="rgba(0,0,0,0.7)" />

        {/* Friso superior (palmetas) */}
        <rect x="10" y="32" width="30" height="3" fill="#A0843E" opacity="0.8" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={`pa-${i}`}
            d={`M ${12 + i * 6} 35 Q ${14 + i * 6} 31 ${16 + i * 6} 35`}
            fill="#5A3A20"
          />
        ))}

        {/* Faixa principal — padrão de greca (meandros) */}
        <rect x="6" y="48" width="38" height="8" fill="#3D2418" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={`gr-${i}`}>
            <path
              d={`M ${8 + i * 6} 50 L ${12 + i * 6} 50 L ${12 + i * 6} 53 L ${10 + i * 6} 53 L ${10 + i * 6} 51.5 L ${11 + i * 6} 51.5 L ${11 + i * 6} 52.5`}
              fill="none"
              stroke="#A0843E"
              strokeWidth="0.5"
              strokeLinejoin="miter"
            />
          </g>
        ))}
        {/* Filetes da greca */}
        <line x1="6" y1="48" x2="44" y2="48" stroke="#A0843E" strokeWidth="0.4" />
        <line x1="6" y1="56" x2="44" y2="56" stroke="#A0843E" strokeWidth="0.4" />

        {/* Faixa inferior — pontilhado */}
        <rect x="10" y="64" width="30" height="3" fill="#5A3A20" opacity="0.85" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <circle key={`dot-${i}`} cx={12 + i * 3} cy="65.5" r="0.7" fill="#D4B056" />
        ))}

        {/* Friso fino abaixo */}
        <line x1="10" y1="70" x2="40" y2="70" stroke="#A0843E" strokeWidth="0.4" opacity="0.7" />
        <line x1="10" y1="72" x2="40" y2="72" stroke="#A0843E" strokeWidth="0.3" opacity="0.55" />

        {/* Pequena pintura figurativa abaixo (silhueta esquemática) */}
        <ellipse cx="25" cy="76" rx="2" ry="1.4" fill="#3D2418" opacity="0.7" />
        <line x1="22" y1="78" x2="28" y2="78" stroke="#3D2418" strokeWidth="0.4" opacity="0.6" />

        {/* Brilho lateral esquerdo */}
        <path
          d="M 14 30 Q 9 50 14 76"
          fill="none"
          stroke="rgba(255,224,170,0.32)"
          strokeWidth="1.4"
        />
        {/* Brilho secundário (estreito) */}
        <path
          d="M 11 40 Q 8.5 56 11 70"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.6"
        />
        {/* Sombra lateral direita */}
        <path
          d="M 36 30 Q 41 50 36 76"
          fill="none"
          stroke="rgba(0,0,0,0.32)"
          strokeWidth="1.4"
        />

        {/* Manchas de pátina */}
        <ellipse cx="20" cy="42" rx="2.4" ry="1.2" fill="rgba(0,0,0,0.18)" />
        <ellipse cx="32" cy="68" rx="1.8" ry="1" fill="rgba(0,0,0,0.15)" />
      </svg>
    </span>
  );
}
