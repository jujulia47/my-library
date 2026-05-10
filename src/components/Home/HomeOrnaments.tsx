/**
 * Ornamento vintage do header da home (sessão 17.10) — substitui o varal de
 * luzes (que ficava deslocado fora do contexto biblioteca). Estilo divisor de
 * frontispício de livro antigo: filete dourado horizontal + fleuron central
 * (rosácea estilizada) + dois pontos decorativos em cada lado.
 *
 * Pura decoração SVG, server component.
 */
export function HomeOrnaments() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 8,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        width="320"
        height="36"
        viewBox="0 0 320 36"
        style={{ overflow: "visible", opacity: 0.85 }}
      >
        <defs>
          <linearGradient id="home-orn-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(212, 176, 86, 0)" />
            <stop offset="20%" stopColor="rgba(212, 176, 86, 0.7)" />
            <stop offset="50%" stopColor="rgba(212, 176, 86, 0.95)" />
            <stop offset="80%" stopColor="rgba(212, 176, 86, 0.7)" />
            <stop offset="100%" stopColor="rgba(212, 176, 86, 0)" />
          </linearGradient>
          <radialGradient id="home-orn-petal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F0D080" />
            <stop offset="60%" stopColor="#A0843E" />
            <stop offset="100%" stopColor="#5A3A20" />
          </radialGradient>
        </defs>

        {/* Filete duplo (linha grossa + linha fina paralela) */}
        <line x1="0" y1="18" x2="320" y2="18" stroke="url(#home-orn-line)" strokeWidth="1.2" />
        <line x1="40" y1="22" x2="280" y2="22" stroke="url(#home-orn-line)" strokeWidth="0.4" />

        {/* Pontos decorativos esquerda */}
        <circle cx="100" cy="18" r="1.6" fill="#A0843E" />
        <circle cx="100" cy="18" r="0.6" fill="#F0D080" />
        <circle cx="118" cy="18" r="1" fill="#A0843E" />

        {/* Pontos decorativos direita */}
        <circle cx="220" cy="18" r="1" fill="#A0843E" />
        <circle cx="202" cy="18" r="1.6" fill="#A0843E" />
        <circle cx="202" cy="18" r="0.6" fill="#F0D080" />

        {/* Fleuron central (rosácea de 4 pétalas + miolo) */}
        <g style={{ transformOrigin: "160px 18px" }}>
          {/* Pétalas (4 elipses rotacionadas) */}
          <ellipse cx="160" cy="10" rx="2.6" ry="6" fill="url(#home-orn-petal)" />
          <ellipse cx="160" cy="26" rx="2.6" ry="6" fill="url(#home-orn-petal)" />
          <ellipse cx="152" cy="18" rx="6" ry="2.6" fill="url(#home-orn-petal)" />
          <ellipse cx="168" cy="18" rx="6" ry="2.6" fill="url(#home-orn-petal)" />
          {/* Pétalas diagonais (menores) */}
          <ellipse
            cx="154"
            cy="12"
            rx="1.6"
            ry="4"
            fill="url(#home-orn-petal)"
            transform="rotate(-45 154 12)"
            opacity="0.85"
          />
          <ellipse
            cx="166"
            cy="12"
            rx="1.6"
            ry="4"
            fill="url(#home-orn-petal)"
            transform="rotate(45 166 12)"
            opacity="0.85"
          />
          <ellipse
            cx="154"
            cy="24"
            rx="1.6"
            ry="4"
            fill="url(#home-orn-petal)"
            transform="rotate(45 154 24)"
            opacity="0.85"
          />
          <ellipse
            cx="166"
            cy="24"
            rx="1.6"
            ry="4"
            fill="url(#home-orn-petal)"
            transform="rotate(-45 166 24)"
            opacity="0.85"
          />
          {/* Miolo */}
          <circle cx="160" cy="18" r="2.4" fill="#3D2418" />
          <circle cx="160" cy="18" r="1.4" fill="#A0843E" />
          <circle cx="160" cy="18" r="0.5" fill="#F0D080" />
        </g>
      </svg>
    </div>
  );
}
