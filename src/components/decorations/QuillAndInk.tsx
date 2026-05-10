import type { CSSProperties } from "react";

type Props = {
  size?: "sm" | "md";
  className?: string;
  style?: CSSProperties;
};

/**
 * Pena saindo de tinteiro vintage. Compartilhado entre a home (DailyQuote) e a
 * página do autor (AuthorQuoteCarousel). O sway é aplicado só no grupo da pena
 * — o tinteiro fica fixo. Animação respeita prefers-reduced-motion via regra
 * global em globals.css.
 */
export function QuillAndInk({ size = "md", className, style }: Props) {
  const dims = size === "sm" ? { w: 36, h: 56 } : { w: 48, h: 72 };

  return (
    <svg
      width={dims.w}
      height={dims.h}
      viewBox="0 0 48 72"
      aria-hidden
      className={className}
      style={{ pointerEvents: "none", ...style }}
    >
      <defs>
        <linearGradient id="quill-ink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5A3A20" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#3D2418" stopOpacity="0" />
          <stop offset="100%" stopColor="#1A0F08" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Pena (raque + barbas + ponta) */}
      <g
        style={{
          transformOrigin: "24px 56px",
          animation: "quill-sway 4s ease-in-out infinite",
        }}
      >
        <path
          d="M 28 4 Q 26 18 24 32 Q 22 44 21 56"
          fill="none"
          stroke="#5A3A20"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Barbas esquerda */}
        <path d="M 27 6 Q 22 5 18 7" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.7" />
        <path d="M 26.5 9 Q 21 8 16 11" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.75" />
        <path d="M 26 12 Q 20 11 14 15" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.8" />
        <path d="M 25.5 16 Q 19 15 13 19" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.85" />
        <path d="M 25 20 Q 18 19 12 24" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.85" />
        <path d="M 24.5 24 Q 18 23 12 28" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.8" />
        <path d="M 24 28 Q 18 27 13 32" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.75" />
        <path d="M 23.5 32 Q 18 31 14 36" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.7" />
        <path d="M 23 36 Q 18 35 15 40" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.65" />
        <path d="M 22.5 40 Q 19 39 17 43" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.6" />

        {/* Barbas direita */}
        <path d="M 28 6 Q 33 5 36 7" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.7" />
        <path d="M 28 9 Q 33.5 8 38 11" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.75" />
        <path d="M 27.5 12 Q 33.5 11 39 15" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.8" />
        <path d="M 27 16 Q 33 15 40 19" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.85" />
        <path d="M 26.5 20 Q 33 19 41 24" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.85" />
        <path d="M 26 24 Q 32 23 40 28" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.8" />
        <path d="M 25.5 28 Q 31 27 38 32" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.75" />
        <path d="M 25 32 Q 30 31 35 36" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.7" />
        <path d="M 24.5 36 Q 28 35 32 40" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.65" />
        <path d="M 24 40 Q 26 39 28 43" stroke="#854F0B" strokeWidth="0.4" fill="none" opacity="0.6" />

        {/* Ponta afinada mergulhada na tinta */}
        <path d="M 21 56 L 22 58 L 21 60 L 20 58 Z" fill="#3D2418" />

        {/* Brilho dourado no topo */}
        <ellipse cx="28" cy="6" rx="1" ry="2" fill="#F0C040" opacity="0.4" />
      </g>

      {/* Tinteiro (fixo) */}
      <ellipse cx="24" cy="69" rx="14" ry="1.5" fill="#1A0F08" opacity="0.4" />
      <path d="M 14 68 Q 14 56 24 56 Q 34 56 34 68 Z" fill="#2D1810" />
      <path d="M 14 68 Q 14 56 24 56 Q 34 56 34 68 Z" fill="url(#quill-ink-gradient)" opacity="0.7" />
      <ellipse cx="19" cy="61" rx="2" ry="3.5" fill="#F0C040" opacity="0.15" />
      <rect x="21" y="52" width="6" height="5" fill="#3D2418" rx="0.5" />
      <rect x="20.5" y="52" width="7" height="1.2" fill="#F0C040" opacity="0.6" />
      <ellipse cx="24" cy="55" rx="2.2" ry="0.5" fill="#1A0F08" />
    </svg>
  );
}
