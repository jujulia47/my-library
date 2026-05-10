/**
 * Vela acesa decorativa (sessão 17.4 — refinada). Cera com gradiente vertical,
 * gotas escorridas em ambos os lados, mecha carbonizada, chama em três
 * camadas (núcleo azul, manto dourado, ponta amarela), halo radial pulsante
 * e prato de bronze com brilho. Animações via classes `flame-flicker` e
 * `halo-pulse` (definidas em globals.css).
 */
export function Vela({ width = 78 }: { width?: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height: width * 1.7 }}
    >
      <svg
        width={width}
        height={width * 1.7}
        viewBox="0 0 32 56"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id="vela-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 218, 130, 0.85)" />
            <stop offset="55%" stopColor="rgba(212, 176, 86, 0.35)" />
            <stop offset="100%" stopColor="rgba(212, 176, 86, 0)" />
          </radialGradient>
          <linearGradient id="vela-wax" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D8C29A" />
            <stop offset="35%" stopColor="#F5E8D0" />
            <stop offset="65%" stopColor="#EADBB7" />
            <stop offset="100%" stopColor="#B69E72" />
          </linearGradient>
          <linearGradient id="vela-flame-outer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE08A" stopOpacity="0.2" />
            <stop offset="40%" stopColor="#FFB347" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#BC6E48" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="vela-flame-inner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFCE0" />
            <stop offset="50%" stopColor="#FFD96A" />
            <stop offset="100%" stopColor="#D4B056" />
          </linearGradient>
          <radialGradient id="vela-flame-core" cx="50%" cy="80%" r="50%">
            <stop offset="0%" stopColor="#9DD6FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9DD6FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="vela-plate" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7B5A2A" />
            <stop offset="100%" stopColor="#3D2418" />
          </linearGradient>
        </defs>

        {/* Halo radial */}
        <circle
          cx="16"
          cy="14"
          r="16"
          fill="url(#vela-halo)"
          className="halo-pulse"
        />

        {/* Cera — corpo */}
        <path
          d="M 11 22 Q 10.4 26 10.6 32 Q 10.8 42 11 50 L 21 50 Q 21.2 42 21.4 32 Q 21.6 26 21 22 Z"
          fill="url(#vela-wax)"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.4"
        />

        {/* Gota escorrida — esquerda */}
        <path
          d="M 11 26 Q 9 31 9.6 36 Q 10 39 11 38 Q 11.2 33 11 30 Z"
          fill="#E8DBBE"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.3"
        />
        {/* Gota escorrida — direita */}
        <path
          d="M 21 30 Q 22.4 35 22 41 Q 21.4 44 20.6 42 Q 20.8 36 21 32 Z"
          fill="#D8C29A"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.3"
        />
        {/* Pingo solto na lateral */}
        <ellipse cx="9.6" cy="40" rx="1" ry="1.5" fill="#E8DBBE" />

        {/* Sombra vertical no corpo */}
        <path
          d="M 19.5 22 Q 19.5 35 19 50"
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="1.4"
        />
        {/* Highlight central */}
        <path
          d="M 14 23 Q 14 35 14 49"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="0.7"
        />

        {/* Topo derretido (concavidade) */}
        <ellipse cx="16" cy="22" rx="5" ry="1.4" fill="#3D2418" opacity="0.45" />
        <ellipse cx="16" cy="21.4" rx="4.4" ry="1" fill="#9D8C73" />

        {/* Pavio carbonizado */}
        <line x1="16" y1="21.4" x2="16" y2="17" stroke="#1A0F09" strokeWidth="0.9" />
        <line x1="16" y1="19" x2="16" y2="17" stroke="#3D2418" strokeWidth="0.6" />

        {/* Chama — três camadas */}
        <g className="flame-flicker" style={{ transformOrigin: "16px 17px" }}>
          {/* Manto externo */}
          <path
            d="M 16 4 Q 20.2 11 19.2 16 Q 17.6 19.5 16 17.5 Q 14.4 19.5 12.8 16 Q 11.8 11 16 4 Z"
            fill="url(#vela-flame-outer)"
          />
          {/* Núcleo dourado */}
          <path
            d="M 16 7 Q 18.6 12 18 15.4 Q 17 17.8 16 17 Q 15 17.8 14 15.4 Q 13.4 12 16 7 Z"
            fill="url(#vela-flame-inner)"
          />
          {/* Núcleo azul (base quente) */}
          <ellipse cx="16" cy="15.6" rx="1.4" ry="2.4" fill="url(#vela-flame-core)" />
          {/* Brilho na ponta */}
          <ellipse cx="16" cy="9" rx="0.6" ry="1.4" fill="rgba(255,255,255,0.85)" />
        </g>

        {/* Pratinho de bronze */}
        <ellipse cx="16" cy="51.6" rx="9" ry="1.6" fill="url(#vela-plate)" />
        <ellipse cx="16" cy="50.8" rx="9" ry="1.4" fill="#7B5A2A" />
        <ellipse cx="16" cy="50.2" rx="6.5" ry="0.9" fill="#A0843E" />
        <ellipse cx="16" cy="50" rx="4.5" ry="0.5" fill="rgba(255,224,170,0.6)" />
        {/* Sombra do prato no chão */}
        <ellipse cx="16" cy="53.4" rx="11" ry="1.2" fill="rgba(0,0,0,0.45)" />
      </svg>
    </span>
  );
}
