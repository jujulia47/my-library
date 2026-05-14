/**
 * Ornamento vintage do header da home — divisor de frontispício em estilo
 * de livro antigo. Composição (esquerda → direita):
 *   1) Filete triplo (linha grossa central + dois filetes finos paralelos)
 *      com fade gradient nas pontas.
 *   2) Diamantes nas extremidades como caps decorativos.
 *   3) Clusters de beads (3 esferas dourada-creme-dourada).
 *   4) Flourishes em S flanqueando o centro, com folha + bead final.
 *   5) Fleuron central (rosácea de 8 pétalas) com aro concêntrico externo
 *      e miolo em três anéis.
 *   6) Folhas verticais (acima e abaixo da linha) em pontos selecionados.
 *
 * Pure SVG, server component, decorativo (aria-hidden).
 */
export function HomeOrnaments() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 6,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        width="720"
        height="40"
        viewBox="0 0 720 40"
        style={{ overflow: "visible", opacity: 0.88, maxWidth: "92%" }}
      >
        <defs>
          <linearGradient id="home-orn-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(212, 176, 86, 0)" />
            <stop offset="15%" stopColor="rgba(212, 176, 86, 0.7)" />
            <stop offset="50%" stopColor="rgba(212, 176, 86, 0.95)" />
            <stop offset="85%" stopColor="rgba(212, 176, 86, 0.7)" />
            <stop offset="100%" stopColor="rgba(212, 176, 86, 0)" />
          </linearGradient>
          <radialGradient id="home-orn-petal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F0D080" />
            <stop offset="60%" stopColor="#A0843E" />
            <stop offset="100%" stopColor="#5A3A20" />
          </radialGradient>
        </defs>

        {/* === FILETES === */}
        {/* Linha principal espessa com gradient fade */}
        <line x1="0" y1="20" x2="720" y2="20" stroke="url(#home-orn-line)" strokeWidth="1.2" />
        {/* Filetes finos paralelos (mais curtos, opacidade reduzida) */}
        <line x1="120" y1="16" x2="600" y2="16" stroke="url(#home-orn-line)" strokeWidth="0.35" opacity="0.6" />
        <line x1="120" y1="24" x2="600" y2="24" stroke="url(#home-orn-line)" strokeWidth="0.35" opacity="0.6" />

        {/* === END CAPS — diamantes nas extremidades === */}
        <g transform="translate(110, 20)">
          <polygon points="0,-4 4,0 0,4 -4,0" fill="#A0843E" />
          <polygon points="0,-2 2,0 0,2 -2,0" fill="#F0D080" />
        </g>
        <g transform="translate(610, 20)">
          <polygon points="0,-4 4,0 0,4 -4,0" fill="#A0843E" />
          <polygon points="0,-2 2,0 0,2 -2,0" fill="#F0D080" />
        </g>

        {/* === BEADS — clusters de 3 esferas === */}
        {/* Cluster esquerdo */}
        <circle cx="170" cy="20" r="1" fill="#A0843E" />
        <circle cx="190" cy="20" r="1.8" fill="#A0843E" />
        <circle cx="190" cy="20" r="0.8" fill="#F0D080" />
        <circle cx="210" cy="20" r="1" fill="#A0843E" />
        {/* Cluster direito */}
        <circle cx="510" cy="20" r="1" fill="#A0843E" />
        <circle cx="530" cy="20" r="1.8" fill="#A0843E" />
        <circle cx="530" cy="20" r="0.8" fill="#F0D080" />
        <circle cx="550" cy="20" r="1" fill="#A0843E" />

        {/* === FLOURISHES — scrolls flanqueando o centro === */}
        {/* Lado esquerdo */}
        <g transform="translate(316, 20)" fill="none" stroke="#A0843E" strokeWidth="0.9" strokeLinecap="round">
          <path d="M 0 0 Q -10 -6 -18 -2 Q -26 2 -22 8 Q -16 12 -10 6 Q -6 2 -2 4" />
          <circle cx="-28" cy="6" r="1.4" fill="#A0843E" stroke="none" />
          <path d="M -10 -3 Q -6 -10 -2 -3 Z" fill="#A0843E" stroke="none" opacity="0.6" />
        </g>
        {/* Lado direito (espelhado) */}
        <g transform="translate(404, 20) scale(-1, 1)" fill="none" stroke="#A0843E" strokeWidth="0.9" strokeLinecap="round">
          <path d="M 0 0 Q -10 -6 -18 -2 Q -26 2 -22 8 Q -16 12 -10 6 Q -6 2 -2 4" />
          <circle cx="-28" cy="6" r="1.4" fill="#A0843E" stroke="none" />
          <path d="M -10 -3 Q -6 -10 -2 -3 Z" fill="#A0843E" stroke="none" opacity="0.6" />
        </g>

        {/* === FLEURON CENTRAL — rosácea de 8 pétalas + miolo concêntrico === */}
        <g transform="translate(360, 20)">
          {/* Aro externo */}
          <circle cx="0" cy="0" r="15" fill="none" stroke="#A0843E" strokeWidth="0.4" opacity="0.45" />
          {/* Pétalas cardinais (4 elipses cruzadas) */}
          <ellipse cx="0" cy="-9" rx="2.8" ry="7.5" fill="url(#home-orn-petal)" />
          <ellipse cx="0" cy="9" rx="2.8" ry="7.5" fill="url(#home-orn-petal)" />
          <ellipse cx="-9" cy="0" rx="7.5" ry="2.8" fill="url(#home-orn-petal)" />
          <ellipse cx="9" cy="0" rx="7.5" ry="2.8" fill="url(#home-orn-petal)" />
          {/* Pétalas diagonais (rotacionadas em torno do próprio centro) */}
          <ellipse cx="-5.5" cy="-5.5" rx="1.7" ry="4.5" fill="url(#home-orn-petal)" transform="rotate(-45 -5.5 -5.5)" opacity="0.88" />
          <ellipse cx="5.5" cy="-5.5" rx="1.7" ry="4.5" fill="url(#home-orn-petal)" transform="rotate(45 5.5 -5.5)" opacity="0.88" />
          <ellipse cx="5.5" cy="5.5" rx="1.7" ry="4.5" fill="url(#home-orn-petal)" transform="rotate(-45 5.5 5.5)" opacity="0.88" />
          <ellipse cx="-5.5" cy="5.5" rx="1.7" ry="4.5" fill="url(#home-orn-petal)" transform="rotate(45 -5.5 5.5)" opacity="0.88" />
          {/* Miolo em três anéis */}
          <circle cx="0" cy="0" r="3.2" fill="#3D2418" />
          <circle cx="0" cy="0" r="2.1" fill="#A0843E" />
          <circle cx="0" cy="0" r="0.9" fill="#F0D080" />
        </g>

        {/* === FOLHAS VERTICAIS — acima e abaixo da linha === */}
        <g fill="#A0843E" opacity="0.55">
          {/* Folhas acima */}
          <path d="M 250 16 Q 254 6 258 16 Z" />
          <path d="M 462 16 Q 466 6 470 16 Z" />
          {/* Folhas abaixo (espelhadas) */}
          <path d="M 250 24 Q 254 34 258 24 Z" />
          <path d="M 462 24 Q 466 34 470 24 Z" />
        </g>
      </svg>
    </div>
  );
}
