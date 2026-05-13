/**
 * Tinteiro com pena — decoração vintage de escritório. Pote escuro de
 * cerâmica com tampa aberta e pena curvada apontando pra cima-direita,
 * com gradient do raquis pra base, sulcos das barbas e brilho sutil na
 * ponta. Originalmente parte da cena `Estante` (BookshelfDecoration);
 * extraído pra virar decoração independente.
 */
export function Tinteiro({ width = 90 }: { width?: number }) {
  // ViewBox em volta do pote + pena. Coordenadas mantidas do original
  // (x ~200-247, y ~22-82) com margem leve.
  const VB_X = 198;
  const VB_Y = 18;
  const VB_W = 52;
  const VB_H = 67;
  const height = Math.round((width * VB_H) / VB_W);
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
      >
        <defs>
          <linearGradient id="tnt-feather" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#9B6A3B" />
            <stop offset="55%" stopColor="#7A4A2A" />
            <stop offset="100%" stopColor="#5B3621" />
          </linearGradient>
        </defs>

        {/* Sombra projetada — funde o pote com a prateleira */}
        <ellipse cx="213" cy="84" rx="15" ry="1.2" fill="rgba(0,0,0,0.32)" />

        {/* === TINTEIRO === */}
        <g>
          {/* Corpo do pote */}
          <path
            d="M203 82 L203 73 Q203 71 205 71 L221 71 Q223 71 223 73 L223 82 Z"
            fill="#5B3621"
          />
          {/* Faixa inferior mais escura — base do pote */}
          <rect x="203" y="78" width="20" height="1" fill="#3D2417" opacity="0.6" />
          {/* Aro / borda superior */}
          <ellipse cx="213" cy="72" rx="9" ry="2" fill="#3D2417" />
          {/* Abertura escura no topo */}
          <ellipse cx="213" cy="71.5" rx="7" ry="1.3" fill="#1A1612" />
          {/* Sombra interna sugere profundidade da tinta */}
          <ellipse cx="213" cy="71.4" rx="5.5" ry="0.8" fill="#3D2417" />
        </g>

        {/* === PENA === */}
        <g>
          {/* Corpo da pena em lágrima alongada */}
          <path
            d="M213 71
               Q 217 56, 224 44
               Q 230 32, 240 22
               Q 247 22, 244 33
               Q 240 46, 232 56
               Q 224 64, 217 69
               Q 214 71, 213 71 Z"
            fill="url(#tnt-feather)"
          />
          {/* Raquis (eixo) */}
          <path
            d="M213 71 Q 218 56, 224 44 Q 230 32, 240 22"
            stroke="#3D2417"
            strokeWidth="0.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Sulcos das barbas */}
          <path
            d="M219 60 Q 224 57, 229 53"
            stroke="#3D2417"
            strokeWidth="0.3"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M222 52 Q 228 49, 233 45"
            stroke="#3D2417"
            strokeWidth="0.3"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M226 43 Q 232 40, 237 36"
            stroke="#3D2417"
            strokeWidth="0.3"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M231 33 Q 236 30, 241 27"
            stroke="#3D2417"
            strokeWidth="0.3"
            fill="none"
            opacity="0.55"
          />
          {/* Brilho na ponta */}
          <path
            d="M240 22 Q 244 22, 245 27"
            stroke="#F5E6C8"
            strokeWidth="0.5"
            fill="none"
            opacity="0.35"
          />
        </g>
      </svg>
    </span>
  );
}
