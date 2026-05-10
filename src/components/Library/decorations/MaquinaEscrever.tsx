/**
 * Máquina de escrever miniatura (refinada). Corpo curvado em laca preta com
 * highlight superior, tipos circulares com letras inscritas, carro com platen
 * cilíndrico, alavanca de retorno, knob lateral, papel com texto datilografado
 * e pequena placa do fabricante. Estática.
 */
export function MaquinaEscrever({ width = 116 }: { width?: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height: width }}
    >
      <svg width={width} height={width} viewBox="0 0 48 48">
        <defs>
          <linearGradient id="tw-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5A3A20" />
            <stop offset="40%" stopColor="#3D2418" />
            <stop offset="100%" stopColor="#1A0F09" />
          </linearGradient>
          <linearGradient id="tw-base" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3D2418" />
            <stop offset="100%" stopColor="#1A0F09" />
          </linearGradient>
          <linearGradient id="tw-platen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5A3A20" />
            <stop offset="50%" stopColor="#2D1810" />
            <stop offset="100%" stopColor="#0E0805" />
          </linearGradient>
          <radialGradient id="tw-key" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#F5E8D0" />
            <stop offset="60%" stopColor="#D4B056" />
            <stop offset="100%" stopColor="#7B5A2A" />
          </radialGradient>
          <linearGradient id="tw-paper" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBF5E2" />
            <stop offset="100%" stopColor="#E8DBBE" />
          </linearGradient>
        </defs>

        {/* Sombra inferior */}
        <ellipse cx="24" cy="44" rx="20" ry="1.6" fill="rgba(0,0,0,0.5)" />

        {/* Base larga (perfil trapezoidal) */}
        <path d="M 4 42 L 6 34 L 42 34 L 44 42 Z" fill="url(#tw-base)" />
        <line x1="6" y1="35" x2="42" y2="35" stroke="rgba(212,176,86,0.45)" strokeWidth="0.3" />

        {/* Corpo principal — curva no topo */}
        <path
          d="M 7 34 Q 7 23 12 22 L 36 22 Q 41 23 41 34 Z"
          fill="url(#tw-body)"
          stroke="#1A0F09"
          strokeWidth="0.4"
        />
        {/* Highlight no topo do corpo */}
        <path
          d="M 9 25 Q 9 24 11 23.6 L 37 23.6 Q 39 24 39 25"
          fill="none"
          stroke="rgba(212,176,86,0.4)"
          strokeWidth="0.4"
        />

        {/* Cesto de tipos (atrás do papel) */}
        <path
          d="M 14 22 Q 18 12 24 12 Q 30 12 34 22 Z"
          fill="#2D1810"
          stroke="#1A0F09"
          strokeWidth="0.3"
        />
        {/* Hastes de tipos */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`bar-${i}`}
            x1={24}
            y1={12}
            x2={16 + i * 4}
            y2={20}
            stroke="#A0843E"
            strokeWidth="0.4"
            opacity="0.7"
          />
        ))}

        {/* Carro com platen (cilindro) */}
        <rect x="8" y="14" width="32" height="3.6" rx="1" fill="#1A0F09" />
        <ellipse cx="40.4" cy="15.8" rx="2.6" ry="2.6" fill="url(#tw-platen)" />
        <ellipse cx="40.4" cy="15.8" rx="1.6" ry="1.6" fill="#3D2418" />
        <ellipse cx="40.4" cy="15.8" rx="0.7" ry="0.7" fill="#A0843E" />
        <ellipse cx="7.6" cy="15.8" rx="2.6" ry="2.6" fill="url(#tw-platen)" />
        <ellipse cx="7.6" cy="15.8" rx="1.6" ry="1.6" fill="#3D2418" />
        <ellipse cx="7.6" cy="15.8" rx="0.7" ry="0.7" fill="#A0843E" />

        {/* Alavanca de retorno do carro */}
        <line x1="7.6" y1="15.8" x2="3.4" y2="9" stroke="#A0843E" strokeWidth="0.7" />
        <circle cx="3.4" cy="9" r="0.9" fill="#A0843E" />

        {/* Papel datilografado saindo */}
        <path
          d="M 17 14 L 17 4 Q 17 3 18 3 L 30 3 Q 31 3 31 4 L 31 14 Z"
          fill="url(#tw-paper)"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.3"
        />
        {/* Linhas de texto */}
        <line x1="19" y1="6" x2="29" y2="6" stroke="#3D2418" strokeWidth="0.35" />
        <line x1="19" y1="8" x2="27" y2="8" stroke="#3D2418" strokeWidth="0.35" />
        <line x1="19" y1="10" x2="28.5" y2="10" stroke="#3D2418" strokeWidth="0.35" />
        <line x1="19" y1="12" x2="26" y2="12" stroke="#3D2418" strokeWidth="0.35" />

        {/* Faixa metálica (carro) */}
        <line x1="9" y1="17.6" x2="39" y2="17.6" stroke="#A0843E" strokeWidth="0.5" />
        <line x1="9" y1="18" x2="39" y2="18" stroke="rgba(0,0,0,0.4)" strokeWidth="0.3" />

        {/* Teclas redondas — 4 fileiras escalonadas */}
        {[
          { row: 0, n: 9, y: 25, off: 9 },
          { row: 1, n: 9, y: 28, off: 10 },
          { row: 2, n: 8, y: 31, off: 12 },
        ].map(({ row, n, y, off }) =>
          Array.from({ length: n }).map((_, i) => (
            <g key={`k-${row}-${i}`}>
              <circle cx={off + i * 3.2} cy={y} r="1.3" fill="url(#tw-key)" />
              <circle
                cx={off + i * 3.2}
                cy={y - 0.3}
                r="0.55"
                fill="rgba(255,255,255,0.55)"
              />
              <circle
                cx={off + i * 3.2}
                cy={y + 0.5}
                r="0.5"
                fill="rgba(0,0,0,0.35)"
              />
            </g>
          )),
        )}
        {/* Barra de espaço */}
        <rect x="14" y="33.5" width="20" height="1.6" rx="0.6" fill="url(#tw-key)" />

        {/* Placa do fabricante */}
        <rect x="20.5" y="36" width="7" height="2.4" rx="0.4" fill="#A0843E" />
        <rect x="21.2" y="36.5" width="5.6" height="1.4" rx="0.2" fill="#3D2418" />
        <line x1="22" y1="37.2" x2="26" y2="37.2" stroke="#A0843E" strokeWidth="0.3" />

        {/* Pés */}
        <rect x="6" y="41.5" width="3" height="1.6" rx="0.3" fill="#1A0F09" />
        <rect x="39" y="41.5" width="3" height="1.6" rx="0.3" fill="#1A0F09" />
      </svg>
    </span>
  );
}
