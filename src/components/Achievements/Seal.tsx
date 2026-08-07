"use client";

/** Glifos dos selos (markup interno de <g>, coordenadas centradas em 0,0). */
export const GLYPH: Record<string, string> = {
  globe:
    '<circle r="17"/><ellipse rx="7.5" ry="17"/><path d="M-17 0H17M-15 -8H15M-15 8H15"/>',
  langs:
    '<path d="M-17 -13 h34 v20 h-13 l-5 6 v-6 h-16 z"/><path d="M-9 -3 h18 M-9 3 h12"/>',
  compass:
    '<circle r="17"/><path d="M0 -10 L5 4 L0 1 L-5 4 Z" fill="currentColor" stroke="none"/>',
  layers:
    '<path d="M0 -16 L18 -6 L0 4 L-18 -6 Z"/><path d="M-18 3 L0 13 L18 3"/>',
  stack:
    '<rect x="-16" y="-15" width="32" height="9" rx="2"/><rect x="-13" y="-4" width="30" height="9" rx="2"/><rect x="-16" y="7" width="32" height="9" rx="2"/>',
  mountain:
    '<path d="M-18 12 L-5 -13 L2 -2 L8 -9 L18 12 Z"/><circle cx="-5" cy="-13" r="0.5"/>',
  flame:
    '<path d="M0 15 C-13 4 -4 -6 0 -16 C4 -6 13 4 0 15 Z"/><path d="M0 15 C-6 9 -2 3 0 -3 C2 3 6 9 0 15Z" fill="currentColor" stroke="none" opacity=".5"/>',
  wave:
    '<path d="M-18 2 q4.5 -13 9 0 t9 0 t9 0" fill="none"/><path d="M-18 8 q4.5 -13 9 0 t9 0 t9 0" fill="none" opacity=".5"/>',
  stars:
    '<path d="M-8 -8 l1.6 3.6 3.9 .3 -3 2.6 1 3.8 -3.5 -2 -3.5 2 1 -3.8 -3-2.6 3.9-.3z" fill="currentColor" stroke="none"/><path d="M8 2 l1.2 2.7 3 .2 -2.3 2 .8 2.9-2.7-1.6-2.7 1.6 .8-2.9-2.3-2 3-.2z" fill="currentColor" stroke="none"/><circle cx="10" cy="-10" r="1.6" fill="currentColor" stroke="none"/>',
  quote:
    '<path d="M-14 -9 c-5 1.5 -6 11 1 12 c2 .3 3 -1 3 -3 c0 -2 -1.5 -3 -3.5 -3 c0 -3 1.5 -4.5 3.5 -5.5 z" fill="currentColor" stroke="none"/><path d="M3 -9 c-5 1.5 -6 11 1 12 c2 .3 3 -1 3 -3 c0 -2 -1.5 -3 -3.5 -3 c0 -3 1.5 -4.5 3.5 -5.5 z" fill="currentColor" stroke="none"/>',
  links:
    '<circle cx="-6.5" cy="0" r="9.5"/><circle cx="6.5" cy="0" r="9.5"/>',
  sprout:
    '<path d="M0 15 V-1"/><path d="M0 -1 C-11 -1 -15 -12 -6 -15 C-2 -11 0 -6 0 -1 Z"/><path d="M0 -1 C11 -1 15 -9 8 -13 C3 -10 0 -6 0 -1 Z"/>',
};

function toRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hx(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}
function mixHex(h: string, t: string, a: number): string {
  const A = toRgb(h);
  const B = toRgb(t);
  return "#" + [0, 1, 2].map((i) => hx(A[i] + (B[i] - A[i]) * a)).join("");
}

type Props = {
  color: string;
  glyph: string;
  locked: boolean;
  /** id único do gradiente (evita colisão entre selos). */
  gradId: string;
  className?: string;
};

/**
 * Selo de cera: disco com gradiente radial, borda gravada, glifo em relevo e
 * textura irregular via filtro #wax (definido uma vez no cliente). Bloqueado
 * fica cinza (a cor real some).
 */
export function Seal({ color, glyph, locked, gradId, className }: Props) {
  const c = locked ? "#6f665a" : color;
  const hi = mixHex(c, "#ffffff", 0.42);
  const lo = mixHex(c, "#000000", 0.34);
  const impr = mixHex(c, "#000000", locked ? 0.35 : 0.5);

  return (
    <svg className={className} viewBox="-52 -52 104 104" role="img" aria-hidden>
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="74%">
          <stop offset="0" stopColor={hi} />
          <stop offset="52%" stopColor={c} />
          <stop offset="100%" stopColor={lo} />
        </radialGradient>
      </defs>
      <g filter="url(#wax)">
        <circle r="45" fill={`url(#${gradId})`} />
      </g>
      <circle r="38" fill="none" stroke="rgba(0,0,0,.16)" strokeWidth="2" />
      <g
        stroke={impr}
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: impr }}
        dangerouslySetInnerHTML={{ __html: GLYPH[glyph] ?? "" }}
      />
    </svg>
  );
}
