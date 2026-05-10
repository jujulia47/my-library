/**
 * Pilha de 3 livros deitados (refinada). Cada livro com gradiente vertical
 * pra dar volume, lombada com nervuras douradas, etiqueta de título no topo,
 * e folhas (pages) visíveis no flanco. Ligeiro deslocamento entre livros pra
 * sensação de empilhado natural.
 */
export function PilhaLivros({ width = 104 }: { width?: number }) {
  const height = Math.round((width * 28) / 42);
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height }}
    >
      <svg width={width} height={height} viewBox="0 0 42 28">
        <defs>
          <linearGradient id="pl-burgundy" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9D4546" />
            <stop offset="50%" stopColor="#82393A" />
            <stop offset="100%" stopColor="#5C2728" />
          </linearGradient>
          <linearGradient id="pl-moss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#728759" />
            <stop offset="50%" stopColor="#5C6E47" />
            <stop offset="100%" stopColor="#3F4D31" />
          </linearGradient>
          <linearGradient id="pl-terra" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4845D" />
            <stop offset="50%" stopColor="#BC6E48" />
            <stop offset="100%" stopColor="#8C4F30" />
          </linearGradient>
          <linearGradient id="pl-pages" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBF5E2" />
            <stop offset="100%" stopColor="#D8C29A" />
          </linearGradient>
        </defs>

        {/* Sombra do conjunto */}
        <ellipse cx="21" cy="27" rx="20" ry="1" fill="rgba(0,0,0,0.45)" />

        {/* === Livro inferior — burgundy === */}
        <rect
          x="2"
          y="20"
          width="38"
          height="6"
          rx="0.6"
          fill="url(#pl-burgundy)"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.4"
        />
        {/* Páginas (lateral direita) */}
        <rect x="38.6" y="20.6" width="1.2" height="4.8" fill="url(#pl-pages)" />
        {[20.8, 21.6, 22.4, 23.2, 24, 24.8].map((y, i) => (
          <line key={`pi-${i}`} x1="38.6" y1={y} x2="39.8" y2={y} stroke="#9D8C73" strokeWidth="0.15" />
        ))}
        {/* Nervuras na lombada */}
        <line x1="3" y1="21.4" x2="38" y2="21.4" stroke="rgba(212,176,86,0.55)" strokeWidth="0.35" />
        <line x1="3" y1="24.6" x2="38" y2="24.6" stroke="rgba(212,176,86,0.55)" strokeWidth="0.35" />
        {/* Etiqueta de título */}
        <rect x="14" y="22.4" width="14" height="1.4" fill="#A0843E" opacity="0.85" />
        <line x1="16" y1="23.1" x2="26" y2="23.1" stroke="#3D2418" strokeWidth="0.25" />

        {/* === Livro do meio — moss === (deslocado +2 px à direita) */}
        <rect
          x="6"
          y="13"
          width="34"
          height="6"
          rx="0.6"
          fill="url(#pl-moss)"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.4"
        />
        <rect x="38.6" y="13.6" width="1.2" height="4.8" fill="url(#pl-pages)" />
        {[13.8, 14.6, 15.4, 16.2, 17, 17.8].map((y, i) => (
          <line key={`pm-${i}`} x1="38.6" y1={y} x2="39.8" y2={y} stroke="#9D8C73" strokeWidth="0.15" />
        ))}
        <line x1="7" y1="14.4" x2="38" y2="14.4" stroke="rgba(212,176,86,0.55)" strokeWidth="0.35" />
        <line x1="7" y1="17.6" x2="38" y2="17.6" stroke="rgba(212,176,86,0.55)" strokeWidth="0.35" />
        <rect x="16" y="15.4" width="14" height="1.4" fill="#A0843E" opacity="0.85" />
        <line x1="18" y1="16.1" x2="28" y2="16.1" stroke="#3D2418" strokeWidth="0.25" />
        {/* Sombra projetada do livro do meio no inferior */}
        <rect x="6" y="19" width="34" height="0.8" fill="rgba(0,0,0,0.35)" />

        {/* === Livro superior — terracota === (deslocado -2px à esquerda) */}
        <rect
          x="4"
          y="6"
          width="30"
          height="6"
          rx="0.6"
          fill="url(#pl-terra)"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.4"
        />
        <rect x="32.6" y="6.6" width="1.2" height="4.8" fill="url(#pl-pages)" />
        {[6.8, 7.6, 8.4, 9.2, 10, 10.8].map((y, i) => (
          <line key={`ps-${i}`} x1="32.6" y1={y} x2="33.8" y2={y} stroke="#9D8C73" strokeWidth="0.15" />
        ))}
        <line x1="5" y1="7.4" x2="32" y2="7.4" stroke="rgba(212,176,86,0.6)" strokeWidth="0.35" />
        <line x1="5" y1="10.6" x2="32" y2="10.6" stroke="rgba(212,176,86,0.6)" strokeWidth="0.35" />
        <rect x="11" y="8.4" width="14" height="1.4" fill="#A0843E" opacity="0.85" />
        <line x1="13" y1="9.1" x2="23" y2="9.1" stroke="#3D2418" strokeWidth="0.25" />
        {/* Sombra projetada do livro superior */}
        <rect x="4" y="12" width="30" height="0.8" fill="rgba(0,0,0,0.35)" />

        {/* Marcador de fita pendurado */}
        <path
          d="M 22 6 L 22 14 L 21 13 L 20 14 L 20 6"
          fill="#82393A"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.2"
        />
      </svg>
    </span>
  );
}
