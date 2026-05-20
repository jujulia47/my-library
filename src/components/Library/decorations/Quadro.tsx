/**
 * Quadro com moldura ornamentada (refinado). Moldura dourada com detalhes
 * em alto-relevo nos cantos (rosáceas), passe-partout creme e tela com 3
 * variantes de conteúdo via `seed`: paisagem (céu, montanhas, lago, sol),
 * botânica (ilustração vintage de flor) ou padrão (vitral geométrico).
 */
export function Quadro({
  seed = "default",
  width = 100,
}: {
  seed?: string;
  width?: number;
}) {
  const height = width * 1.25;
  const variant = pickVariant(seed);

  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height }}
    >
      <svg width={width} height={height} viewBox="0 0 76 95">
        <defs>
          <linearGradient id="qd-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0D080" />
            <stop offset="40%" stopColor="#D4B056" />
            <stop offset="70%" stopColor="#A0843E" />
            <stop offset="100%" stopColor="#5A3A20" />
          </linearGradient>
          <linearGradient id="qd-frame-inner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7B5A2A" />
            <stop offset="100%" stopColor="#3D2418" />
          </linearGradient>
          <linearGradient id="qd-mat" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5E8D0" />
            <stop offset="100%" stopColor="#D8C29A" />
          </linearGradient>
        </defs>

        {/* Sombra projetada */}
        <rect
          x="6"
          y="8"
          width="64"
          height="78"
          rx="2"
          fill="rgba(0,0,0,0.45)"
        />

        {/* Moldura externa — gradiente dourado */}
        <rect
          x="2"
          y="4"
          width="64"
          height="78"
          rx="2"
          fill="url(#qd-gold)"
          stroke="#3D2418"
          strokeWidth="0.7"
        />

        {/* Sulco interno da moldura */}
        <rect
          x="5"
          y="7"
          width="58"
          height="72"
          rx="1.2"
          fill="none"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.6"
        />
        {/* Filete dourado interno */}
        <rect
          x="6.5"
          y="8.5"
          width="55"
          height="69"
          rx="0.8"
          fill="url(#qd-frame-inner)"
        />

        {/* Brilhos nas bordas (realismo metálico) */}
        <line x1="3" y1="6" x2="65" y2="6" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6" />
        <line x1="3" y1="6" x2="3" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <line x1="65" y1="6" x2="65" y2="80" stroke="rgba(0,0,0,0.4)" strokeWidth="0.4" />
        <line x1="3" y1="80" x2="65" y2="80" stroke="rgba(0,0,0,0.4)" strokeWidth="0.4" />

        {/* Rosáceas/cantos ornamentados */}
        {[
          { cx: 7, cy: 9 },
          { cx: 61, cy: 9 },
          { cx: 7, cy: 77 },
          { cx: 61, cy: 77 },
        ].map(({ cx, cy }, i) => (
          <g key={`c-${i}`}>
            <circle cx={cx} cy={cy} r="2.4" fill="#A0843E" stroke="#3D2418" strokeWidth="0.3" />
            <circle cx={cx} cy={cy} r="1.4" fill="#D4B056" />
            <circle cx={cx} cy={cy} r="0.6" fill="#3D2418" />
          </g>
        ))}

        {/* Passe-partout */}
        <rect x="9" y="11" width="50" height="64" fill="url(#qd-mat)" />
        {/* Linha bisotê interna */}
        <rect x="10.5" y="12.5" width="47" height="61" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.3" />

        {/* Tela */}
        <rect x="12" y="14" width="44" height="58" fill="#F5E8D0" />

        {variant === "paisagem" && <PaisagemArt />}
        {variant === "botanica" && <BotanicaArt />}
        {variant === "padrao" && <PadraoArt />}

        {/* Cordão de pendurar (atrás, pequeno) */}
        <path
          d="M 28 4 Q 34 1 40 4"
          fill="none"
          stroke="#5A3A20"
          strokeWidth="0.6"
          opacity="0.7"
        />
      </svg>
    </span>
  );
}

function pickVariant(seed: string): "paisagem" | "botanica" | "padrao" {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % 3;
  return idx === 0 ? "paisagem" : idx === 1 ? "botanica" : "padrao";
}

function PaisagemArt() {
  return (
    <g>
      <defs>
        <linearGradient id="qd-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4845D" />
          <stop offset="60%" stopColor="#F0C040" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FBF5E2" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="qd-water" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5A8FB0" />
          <stop offset="100%" stopColor="#1E3A5F" />
        </linearGradient>
      </defs>
      {/* Céu */}
      <rect x="12" y="14" width="44" height="30" fill="url(#qd-sky)" />
      {/* Sol radiante */}
      <circle cx="46" cy="22" r="4.5" fill="#FFE08A" />
      <circle cx="46" cy="22" r="3" fill="#F0C040" />
      {/* Nuvens */}
      <ellipse cx="20" cy="20" rx="4" ry="1.2" fill="rgba(255,255,255,0.6)" />
      <ellipse cx="32" cy="24" rx="3.5" ry="1" fill="rgba(255,255,255,0.55)" />
      {/* Montanhas distantes */}
      <polygon points="12,44 22,28 32,38 42,24 56,42 56,44" fill="#5C6E47" />
      <polygon points="12,44 18,36 26,44 36,30 50,44 56,44" fill="#3F4D31" />
      {/* Reflexo do sol no lago */}
      <rect x="12" y="44" width="44" height="10" fill="url(#qd-water)" />
      <ellipse cx="46" cy="46" rx="4" ry="0.6" fill="rgba(255,224,138,0.55)" />
      <line x1="40" y1="48" x2="52" y2="48" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
      <line x1="38" y1="50" x2="54" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
      {/* Margem grama */}
      <rect x="12" y="54" width="44" height="18" fill="#5C6E47" />
      <path
        d="M 12 60 Q 24 56 36 60 Q 48 64 56 60"
        fill="none"
        stroke="#3F4D31"
        strokeWidth="0.5"
      />
      {/* Árvore solitária */}
      <rect x="20" y="56" width="1.4" height="6" fill="#3D2418" />
      <ellipse cx="20.7" cy="55" rx="3" ry="3.2" fill="#3F4D31" />
    </g>
  );
}

function BotanicaArt() {
  return (
    <g>
      {/* Fundo papel envelhecido */}
      <rect x="12" y="14" width="44" height="58" fill="#F0E4C8" />
      {/* Manchas de envelhecimento (foxing) */}
      <circle cx="19" cy="22" r="2.6" fill="rgba(160,132,62,0.13)" />
      <circle cx="49" cy="62" r="3.4" fill="rgba(160,132,62,0.1)" />
      <circle cx="46" cy="20" r="1.8" fill="rgba(160,132,62,0.1)" />

      {/* Caule curvo */}
      <path
        d="M 34 69 Q 32.5 50 34 31"
        stroke="#5C6E47"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />

      {/* Folhas alternadas */}
      <path d="M 34 58 Q 25 55 23 46 Q 29 50 34 56 Z" fill="#7E9C5E" />
      <path d="M 34 50 Q 43 47 45 38 Q 39 42 34 48 Z" fill="#5C6E47" />
      <path d="M 34 43 Q 26 41 25 33 Q 30 37 34 42 Z" fill="#7E9C5E" />
      {/* Nervuras das folhas */}
      <path d="M 34 57 Q 29 53 24 47" stroke="#3F4D31" strokeWidth="0.3" fill="none" />
      <path d="M 34 49 Q 39 45 44 39" stroke="#3F4D31" strokeWidth="0.3" fill="none" />

      {/* Flor principal — 4 pétalas cardinais + miolo */}
      <ellipse cx="34" cy="22" rx="2.5" ry="3.6" fill="#D98C6A" />
      <ellipse cx="34" cy="32" rx="2.5" ry="3.6" fill="#C97B5A" />
      <ellipse cx="29" cy="27" rx="3.6" ry="2.5" fill="#D98C6A" />
      <ellipse cx="39" cy="27" rx="3.6" ry="2.5" fill="#D98C6A" />
      {/* Pétalas diagonais menores */}
      <ellipse cx="30.6" cy="23.6" rx="2" ry="2.8" fill="#E0A07E" opacity="0.9" transform="rotate(-45 30.6 23.6)" />
      <ellipse cx="37.4" cy="23.6" rx="2" ry="2.8" fill="#E0A07E" opacity="0.9" transform="rotate(45 37.4 23.6)" />
      {/* Miolo */}
      <circle cx="34" cy="27" r="2.6" fill="#E8B84F" />
      <circle cx="34" cy="27" r="1.3" fill="#A0843E" />

      {/* Botão lateral (flor fechada) */}
      <ellipse cx="44" cy="36" rx="1.8" ry="2.8" fill="#C97B5A" />
      <path d="M 44 38.5 L 44 41" stroke="#5C6E47" strokeWidth="0.6" />

      {/* Etiqueta botânica (linhas sugerindo nome em latim) */}
      <line x1="22" y1="65" x2="46" y2="65" stroke="#A0843E" strokeWidth="0.4" opacity="0.55" />
      <line x1="26" y1="68" x2="42" y2="68" stroke="#A0843E" strokeWidth="0.3" opacity="0.4" />
    </g>
  );
}

function PadraoArt() {
  return (
    <g>
      <defs>
        <linearGradient id="qd-pat-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0A1830" />
        </linearGradient>
      </defs>
      <rect x="12" y="14" width="44" height="58" fill="url(#qd-pat-bg)" />
      {/* Padrão geométrico — losangos com detalhes (vitral) */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3].map((col) => {
          const cx = 16 + col * 11;
          const cy = 20 + row * 13;
          const colorOuter = (row + col) % 2 === 0 ? "#A0843E" : "#82393A";
          const colorInner = (row + col) % 2 === 0 ? "#D4B056" : "#9D4546";
          return (
            <g key={`${row}-${col}`}>
              <polygon
                points={`${cx},${cy - 5.5} ${cx + 5},${cy} ${cx},${cy + 5.5} ${cx - 5},${cy}`}
                fill={colorOuter}
                stroke="#3D2418"
                strokeWidth="0.4"
              />
              <polygon
                points={`${cx},${cy - 2.5} ${cx + 2.4},${cy} ${cx},${cy + 2.5} ${cx - 2.4},${cy}`}
                fill={colorInner}
              />
              <circle cx={cx} cy={cy} r="0.6" fill="#F5E8D0" />
            </g>
          );
        }),
      )}
      {/* Linhas de chumbo (vitral) */}
      <line x1="12" y1="33" x2="56" y2="33" stroke="#3D2418" strokeWidth="0.4" opacity="0.6" />
      <line x1="12" y1="46" x2="56" y2="46" stroke="#3D2418" strokeWidth="0.4" opacity="0.6" />
      <line x1="12" y1="59" x2="56" y2="59" stroke="#3D2418" strokeWidth="0.4" opacity="0.6" />
    </g>
  );
}
