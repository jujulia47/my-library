/**
 * Estante mini — lupa encostada numa fileira de 6 livros verticais com
 * lombadas ornamentadas (frisos dourados, losangos, etiquetas). ViewBox
 * apertado em volta do conteúdo pra que o `width` controle direto o
 * tamanho visual dos livros (sem empty space lateral).
 */
export function Estante({ width = 280 }: { width?: number }) {
  // ViewBox em volta do conteúdo (lupa + 6 livros). Coords mantidas no
  // sistema original do BookshelfDecoration pra facilitar comparação.
  const VB_X = 12;
  const VB_Y = 17;
  const VB_W = 110;
  const VB_H = 68;
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
        {/* Sombra projetada — funde os itens com a prateleira da biblioteca */}
        <ellipse cx="68" cy="83" rx="55" ry="1.4" fill="rgba(0,0,0,0.28)" />

        {/* === LUPA === (encostada no primeiro livro vertical em x=48) */}
        <g>
          <line
            x1="20"
            y1="80"
            x2="32"
            y2="64"
            stroke="#5B3621"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <line
            x1="20"
            y1="80"
            x2="32"
            y2="64"
            stroke="#A86932"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.65"
          />
          <circle cx="20" cy="80" r="2.6" fill="#3D2417" />
          <circle cx="38" cy="57" r="9.5" fill="none" stroke="#5B3621" strokeWidth="2.6" />
          <circle cx="38" cy="57" r="7.6" fill="#F8E9CB" opacity="0.55" />
          <circle cx="35" cy="54" r="3" fill="#fff" opacity="0.6" />
        </g>

        {/* === LIVROS VERTICAIS === */}
        {/* Livro 1: azul-marinho escuro com losango */}
        <g>
          <rect x="48" y="27" width="11" height="55" fill="#1F1A2E" />
          <line x1="48" y1="30" x2="59" y2="30" stroke="#E8BD58" strokeWidth="0.6" />
          <line x1="48" y1="78" x2="59" y2="78" stroke="#E8BD58" strokeWidth="0.6" />
          <line x1="49" y1="40" x2="58" y2="40" stroke="#E8BD58" strokeWidth="0.3" />
          <line x1="49" y1="63" x2="58" y2="63" stroke="#E8BD58" strokeWidth="0.3" />
          <path d="M53.5 49 L56 53 L53.5 57 L51 53 Z" fill="#E8BD58" />
        </g>

        {/* Livro 2: marrom médio com etiqueta creme */}
        <g>
          <rect x="60" y="30" width="13" height="52" fill="#7A4A2A" />
          <line x1="60" y1="33" x2="73" y2="33" stroke="#E8BD58" strokeWidth="0.5" />
          <line x1="60" y1="79" x2="73" y2="79" stroke="#E8BD58" strokeWidth="0.5" />
          <rect x="61.5" y="46" width="10" height="9" fill="#E8D7B5" />
          <line x1="62.5" y1="48.5" x2="70.5" y2="48.5" stroke="#6B4226" strokeWidth="0.25" />
          <line x1="62.5" y1="51.5" x2="70.5" y2="51.5" stroke="#6B4226" strokeWidth="0.25" />
        </g>

        {/* Livro 3: preto/marrom slim */}
        <g>
          <rect x="74" y="22" width="8" height="60" fill="#2A1810" />
          <line x1="74" y1="25" x2="82" y2="25" stroke="#E8BD58" strokeWidth="0.5" />
          <line x1="74" y1="79" x2="82" y2="79" stroke="#E8BD58" strokeWidth="0.5" />
          <line x1="75" y1="50" x2="81" y2="50" stroke="#E8BD58" strokeWidth="0.3" />
        </g>

        {/* Livro 4: marrom rico com losango */}
        <g>
          <rect x="83" y="25" width="11" height="57" fill="#5B3621" />
          <line x1="83" y1="28" x2="94" y2="28" stroke="#E8BD58" strokeWidth="0.5" />
          <line x1="83" y1="79" x2="94" y2="79" stroke="#E8BD58" strokeWidth="0.5" />
          <line x1="84" y1="40" x2="93" y2="40" stroke="#E8BD58" strokeWidth="0.25" />
          <line x1="84" y1="65" x2="93" y2="65" stroke="#E8BD58" strokeWidth="0.25" />
          <path d="M88.5 50 L91 53 L88.5 56 L86 53 Z" fill="#E8BD58" opacity="0.85" />
        </g>

        {/* Livro 5: preto com etiqueta dourada */}
        <g>
          <rect x="95" y="30" width="12" height="52" fill="#1A1612" />
          <line x1="95" y1="33" x2="107" y2="33" stroke="#E8BD58" strokeWidth="0.5" />
          <line x1="95" y1="79" x2="107" y2="79" stroke="#E8BD58" strokeWidth="0.5" />
          <rect x="96.5" y="46" width="9" height="9" fill="#E8BD58" opacity="0.82" />
        </g>

        {/* Livro 6: verde-musgo profundo com faixa central */}
        <g>
          <rect x="108" y="33" width="10" height="49" fill="#2E4D2A" />
          <line x1="108" y1="36" x2="118" y2="36" stroke="#E8BD58" strokeWidth="0.5" />
          <line x1="108" y1="79" x2="118" y2="79" stroke="#E8BD58" strokeWidth="0.5" />
          <line x1="109" y1="55" x2="117" y2="55" stroke="#E8BD58" strokeWidth="0.4" />
        </g>
      </svg>
    </span>
  );
}
