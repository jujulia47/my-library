/**
 * Livro deitado horizontal — atravessa 1-2 lombadas vizinhas no topo da
 * prateleira, parecendo "largado em cima dos outros". Cor aleatória da
 * paleta. Capa com gradiente, fore-edge com folhas visíveis, faixa dourada
 * com texto fantasma e marcador de fita pendente.
 *
 * Sessão 17.10: espessura agora varia (assim como livros em pé). Como a
 * decoração não tem `book.pages` real, derivamos um número de páginas
 * fictício do seed (50-700) e usamos `layingThicknessForPages`.
 */
import {
  layingThicknessForPages,
  spineHexForBookId,
} from "@/utils/spineColors";

function pseudoPagesFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return 50 + (Math.abs(hash) % 651); // 50-700
}

export function LivroDeitado({
  seed,
  width = 150,
}: {
  /** Seed estável (ex.: shelf.id + posição) pra cor determinística. */
  seed: string;
  width?: number;
}) {
  // Reusa a mesma paleta das lombadas pra coerência.
  const fill = spineHexForBookId(seed);
  const pseudoPages = pseudoPagesFromSeed(seed);
  // Range visual da decoração ligeiramente maior que o cluster (14-26)
  // pra ela aparecer em cima dos livros em pé com mais presença.
  const height = Math.round(layingThicknessForPages(pseudoPages) * 1.15);

  // Gradiente único por seed (evita colisão de IDs entre múltiplos livros).
  const gradId = `ld-grad-${seed.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width, height }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} 18`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fill} stopOpacity="0.6" />
            <stop offset="20%" stopColor={fill} stopOpacity="1" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* Sombra projetada */}
        <rect x="2" y="14" width={width - 4} height="3" fill="rgba(0,0,0,0.45)" />

        {/* Capa */}
        <rect
          x="1"
          y="1"
          width={width - 2}
          height="13"
          rx="0.6"
          fill={`url(#${gradId})`}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.5"
        />

        {/* Fore-edge (páginas) — flanco direito */}
        <rect x={width - 4} y="2" width="3" height="11" fill="#FBF5E2" />
        {Array.from({ length: 18 }).map((_, i) => (
          <line
            key={`pg-${i}`}
            x1={width - 4}
            y1={2.4 + i * 0.6}
            x2={width - 1}
            y2={2.4 + i * 0.6}
            stroke="#9D8C73"
            strokeWidth="0.12"
          />
        ))}
        {/* Sombra entre capa e páginas */}
        <line x1={width - 4} y1="2" x2={width - 4} y2="13" stroke="rgba(0,0,0,0.4)" strokeWidth="0.4" />

        {/* Lombada — costura simulada (4 nervuras) */}
        <rect x="1" y="1" width="2.4" height="13" fill={fill} stroke="rgba(0,0,0,0.4)" strokeWidth="0.4" />
        {[3.5, 6.5, 9.5, 12].map((y, i) => (
          <line key={`r-${i}`} x1="1" y1={y} x2="3.4" y2={y} stroke="rgba(0,0,0,0.45)" strokeWidth="0.3" />
        ))}

        {/* Faixa dourada superior */}
        <rect x="6" y="3" width={width - 14} height="2" fill="rgba(212, 176, 86, 0.55)" rx="0.2" />
        {/* Texto fantasma na faixa */}
        <line x1="10" y1="4" x2={width - 18} y2="4" stroke="#3D2418" strokeWidth="0.35" opacity="0.55" />

        {/* Filete decorativo central */}
        <line
          x1="6"
          y1="9"
          x2={width - 8}
          y2="9"
          stroke="rgba(212, 176, 86, 0.35)"
          strokeWidth="0.3"
        />
        {/* Filete inferior */}
        <line
          x1="6"
          y1="11.5"
          x2={width - 8}
          y2="11.5"
          stroke="rgba(212, 176, 86, 0.35)"
          strokeWidth="0.3"
        />

        {/* Highlight de couro no topo */}
        <line x1="2" y1="1.6" x2={width - 2} y2="1.6" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />

        {/* Marcador de fita pendente */}
        <path
          d={`M ${width - 30} 13 L ${width - 30} 17 L ${width - 31.5} 16 L ${width - 33} 17 L ${width - 33} 13 Z`}
          fill="#82393A"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.2"
        />
      </svg>
    </span>
  );
}
