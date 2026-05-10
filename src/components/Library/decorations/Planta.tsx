/**
 * Planta em vaso de cerâmica terracota (refinada). Folhagem com múltiplos
 * tons de verde, nervuras visíveis, formas variadas (lanceolada, oval,
 * recortada). Vaso com gradiente, borda saliente, terra escura visível,
 * brilhos laterais. Animação `sway` no grupo de folhagem.
 */
export function Planta({ width = 98 }: { width?: number }) {
  const height = width * 1.65;
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 76 125"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="pl-pot" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8C4F30" />
            <stop offset="35%" stopColor="#BC6E48" />
            <stop offset="70%" stopColor="#A0563B" />
            <stop offset="100%" stopColor="#6B3920" />
          </linearGradient>
          <linearGradient id="pl-rim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A0563B" />
            <stop offset="100%" stopColor="#6B3920" />
          </linearGradient>
          <linearGradient id="pl-leaf-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#728759" />
            <stop offset="100%" stopColor="#3F4D31" />
          </linearGradient>
          <linearGradient id="pl-leaf-mid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86A266" />
            <stop offset="100%" stopColor="#5C6E47" />
          </linearGradient>
          <linearGradient id="pl-leaf-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A8C181" />
            <stop offset="100%" stopColor="#728759" />
          </linearGradient>
          <radialGradient id="pl-soil" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#3D2418" />
            <stop offset="100%" stopColor="#1A0F09" />
          </radialGradient>
        </defs>

        {/* Folhagem — animada */}
        <g className="plant-sway" style={{ transformOrigin: "38px 78px" }}>
          {/* Folha grande esquerda alta — lanceolada */}
          <path
            d="M 36 78 Q 18 56 8 24 Q 14 30 22 42 Q 30 54 36 78 Z"
            fill="url(#pl-leaf-dark)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.5"
          />
          <path
            d="M 36 78 Q 24 50 14 28"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.4"
          />

          {/* Folha grande direita alta */}
          <path
            d="M 40 78 Q 58 56 68 24 Q 62 30 54 42 Q 46 54 40 78 Z"
            fill="url(#pl-leaf-mid)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.5"
          />
          <path
            d="M 40 78 Q 52 50 62 28"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="0.4"
          />

          {/* Folha central — recortada (estilo monstera simplificada) */}
          <path
            d="M 38 78 Q 33 50 36 16 Q 38 12 40 16 Q 43 50 38 78 Z"
            fill="url(#pl-leaf-light)"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="0.5"
          />
          {/* Recortes nas bordas */}
          <path d="M 36 28 Q 33 30 35 34" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.4" />
          <path d="M 36 42 Q 32.5 44 34.5 48" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.4" />
          <path d="M 40 30 Q 43 32 41 36" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.4" />
          <path d="M 40 44 Q 43.5 46 41.5 50" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.4" />

          {/* Folhas laterais médias */}
          <path
            d="M 36 78 Q 22 70 6 60 Q 14 70 24 76 Q 32 80 36 78 Z"
            fill="url(#pl-leaf-mid)"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="0.5"
          />
          <path
            d="M 40 78 Q 54 70 70 60 Q 62 70 52 76 Q 44 80 40 78 Z"
            fill="url(#pl-leaf-dark)"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="0.5"
          />

          {/* Folhas pequenas frente */}
          <path
            d="M 38 80 Q 30 84 24 86 Q 30 82 36 80 Z"
            fill="url(#pl-leaf-light)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.4"
          />
          <path
            d="M 38 80 Q 46 84 52 86 Q 46 82 40 80 Z"
            fill="url(#pl-leaf-mid)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.4"
          />

          {/* Pequeno botão / broto novo */}
          <path
            d="M 38 76 Q 36 70 38 64 Q 40 70 38 76 Z"
            fill="#A8C181"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.3"
          />

          {/* Nervuras */}
          <line x1="38" y1="78" x2="38" y2="20" stroke="#3D2418" strokeWidth="0.4" opacity="0.45" />
          <line x1="36" y1="78" x2="20" y2="40" stroke="#3D2418" strokeWidth="0.35" opacity="0.4" />
          <line x1="40" y1="78" x2="56" y2="40" stroke="#3D2418" strokeWidth="0.35" opacity="0.4" />
        </g>

        {/* Sombra projetada do vaso no chão */}
        <ellipse cx="38" cy="119" rx="26" ry="2.6" fill="rgba(0,0,0,0.5)" />

        {/* Vaso — corpo */}
        <path
          d="M 18 84 L 21 116 L 55 116 L 58 84 Z"
          fill="url(#pl-pot)"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.7"
        />

        {/* Borda superior do vaso (mais saliente) */}
        <path
          d="M 14 78 L 62 78 L 60 86 L 16 86 Z"
          fill="url(#pl-rim)"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.6"
        />
        {/* Sombra interna da borda */}
        <ellipse cx="38" cy="79" rx="22" ry="1.8" fill="url(#pl-soil)" />
        {/* Terra visível */}
        <ellipse cx="38" cy="80.5" rx="20" ry="1.4" fill="#2D1810" />
        {/* Pedrinhas na terra */}
        <circle cx="28" cy="80.5" r="0.6" fill="#5A3A20" />
        <circle cx="34" cy="80.2" r="0.4" fill="#9D8C73" />
        <circle cx="42" cy="80.6" r="0.5" fill="#7B5A2A" />
        <circle cx="48" cy="80.3" r="0.4" fill="#5A3A20" />

        {/* Frisos horizontais decorativos */}
        <line x1="22" y1="96" x2="55" y2="96" stroke="rgba(0,0,0,0.28)" strokeWidth="0.5" />
        <line x1="20.6" y1="106" x2="55.4" y2="106" stroke="rgba(0,0,0,0.28)" strokeWidth="0.5" />

        {/* Brilho lateral esquerdo */}
        <path
          d="M 22 90 Q 20 100 22.5 114"
          fill="none"
          stroke="rgba(255,224,170,0.3)"
          strokeWidth="1.2"
        />
        {/* Sombra lateral direita */}
        <path
          d="M 54 90 Q 56 100 53.5 114"
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1.2"
        />

        {/* Manchas/pátina no terracota */}
        <ellipse cx="30" cy="100" rx="3" ry="2" fill="rgba(0,0,0,0.15)" />
        <ellipse cx="44" cy="108" rx="2.5" ry="1.5" fill="rgba(0,0,0,0.12)" />
      </svg>
    </span>
  );
}
