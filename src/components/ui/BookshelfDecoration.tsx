/**
 * Ilustração decorativa de uma estante — usada na detail page do livro
 * quando o ownership_status é "owned". Composição: lupa à esquerda,
 * fileira de livros verticais com lombadas ornamentadas, pilha de livros
 * horizontais com um livro aberto no topo, e uma pena no tinteiro à
 * direita. Paleta dourado/marrom/burgundy pra combinar com o tema do app.
 */
export default function BookshelfDecoration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      width="260"
      height="100"
      viewBox="0 0 260 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="bsd-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A2E1A" />
          <stop offset="60%" stopColor="#3A2418" />
          <stop offset="100%" stopColor="#2A1810" />
        </linearGradient>
        <linearGradient id="bsd-feather" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#9B6A3B" />
          <stop offset="55%" stopColor="#7A4A2A" />
          <stop offset="100%" stopColor="#5B3621" />
        </linearGradient>
      </defs>

      {/* Prateleira de madeira */}
      <rect x="2" y="82" width="256" height="7" fill="url(#bsd-wood)" />
      <rect x="2" y="82" width="256" height="1" fill="rgba(212, 176, 86, 0.45)" />
      <rect x="6" y="89" width="248" height="1" fill="rgba(0, 0, 0, 0.28)" />

      {/* === LUPA === (encostada no primeiro livro vertical em x=48) */}
      <g>
        {/* Cabo */}
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
        {/* Pomo do cabo */}
        <circle cx="20" cy="80" r="2.6" fill="#3D2417" />
        {/* Aro */}
        <circle cx="38" cy="57" r="9.5" fill="none" stroke="#5B3621" strokeWidth="2.6" />
        {/* Lente */}
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

      {/* === PILHA DE LIVROS HORIZONTAIS === */}
      {/* Livro de baixo: marrom claro com marcador */}
      <g>
        <rect x="125" y="74" width="60" height="8" fill="#7A4A2A" rx="0.5" />
        <line x1="127" y1="76" x2="183" y2="76" stroke="#E8BD58" strokeWidth="0.3" opacity="0.7" />
        <line x1="127" y1="80" x2="183" y2="80" stroke="#E8BD58" strokeWidth="0.3" opacity="0.7" />
        {/* Marcador */}
        <path d="M165 82 L165 90 L168 88 L171 90 L171 82 Z" fill="#B23545" />
      </g>
      {/* Livro do meio: burgundy com etiqueta dourada */}
      <g>
        <rect x="129" y="66" width="54" height="8" fill="#A8344F" rx="0.5" />
        <rect x="155" y="68" width="16" height="4.5" fill="#E8BD58" opacity="0.8" />
      </g>
      {/* Livro de cima: marrom escuro */}
      <g>
        <rect x="132" y="58" width="48" height="8" fill="#5B3621" rx="0.5" />
        <rect x="135" y="60" width="6" height="4.5" fill="#E8BD58" opacity="0.7" />
      </g>

      {/* === LIVRO ABERTO NO TOPO === */}
      <g>
        {/* Página esquerda */}
        <path
          d="M139 56 Q 143 49, 154 52 L 154 58 Q 143 55, 139 60 Z"
          fill="#E8D7B5"
          stroke="#6B4226"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Página direita */}
        <path
          d="M154 52 Q 165 49, 170 56 L 170 60 Q 165 55, 154 58 Z"
          fill="#F5E6C8"
          stroke="#6B4226"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Dobra central */}
        <line x1="154" y1="52" x2="154" y2="58" stroke="#6B4226" strokeWidth="0.6" />
        {/* Linhas de texto sugeridas */}
        <line x1="142" y1="56" x2="152" y2="54.5" stroke="#8B5A2B" strokeWidth="0.2" opacity="0.5" />
        <line x1="156" y1="54.5" x2="167" y2="56" stroke="#8B5A2B" strokeWidth="0.2" opacity="0.5" />
      </g>

      {/* === PENA NO TINTEIRO === */}
      {/* Tinteiro */}
      <g>
        <path
          d="M203 82 L203 73 Q203 71 205 71 L221 71 Q223 71 223 73 L223 82 Z"
          fill="#5B3621"
        />
        <rect x="203" y="78" width="20" height="1" fill="#3D2417" opacity="0.6" />
        <ellipse cx="213" cy="72" rx="9" ry="2" fill="#3D2417" />
        <ellipse cx="213" cy="71.5" rx="7" ry="1.3" fill="#1A1612" />
        <ellipse cx="213" cy="71.4" rx="5.5" ry="0.8" fill="#3D2417" />
      </g>
      {/* Pena — corpo curvo em formato de lágrima alongada */}
      <g>
        <path
          d="M213 71
             Q 217 56, 224 44
             Q 230 32, 240 22
             Q 247 22, 244 33
             Q 240 46, 232 56
             Q 224 64, 217 69
             Q 214 71, 213 71 Z"
          fill="url(#bsd-feather)"
        />
        {/* Raquis (eixo) da pena */}
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
  );
}
