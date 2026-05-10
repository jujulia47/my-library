"use client";

import { useEffect, useState } from "react";

const SPACING = 90;
const MIN_LAMPS = 8;
const SSR_FALLBACK_WIDTH = 1200;

const LAMP_W = 22;
const LAMP_H = 36;

/**
 * Varal de luzinhas (sessão 17.4 → 17.9 → refinado em 17.10).
 *
 * Cada lâmpada agora é um SVG inline tipo Edison: soquete de bronze com
 * roscas, bulbo em formato pera com gradiente vidro-âmbar, filamento em
 * zigue-zague brilhante, halo radial pulsando e brilho lateral. O fio
 * (catenária) é uma curva quadrática separada que escala com a viewport;
 * as lâmpadas são desenhadas em pixel real (contagem deriva da largura).
 */
export function VaralLuzes() {
  const [width, setWidth] = useState(SSR_FALLBACK_WIDTH);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const lampCount = Math.max(MIN_LAMPS, Math.floor(width / SPACING));

  return (
    <div
      aria-hidden
      className="varal-luzes"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        pointerEvents: "none",
      }}
    >
      {/* Catenária — fio escuro com brilho dourado discreto. */}
      <svg
        viewBox={`0 0 ${width} 60`}
        preserveAspectRatio="none"
        width="100%"
        height="60"
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d={`M 0 18 Q ${width / 2} 36 ${width} 18`}
          stroke="rgba(40, 24, 14, 0.85)"
          fill="none"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={`M 0 18 Q ${width / 2} 36 ${width} 18`}
          stroke="rgba(212, 176, 86, 0.25)"
          fill="none"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {Array.from({ length: lampCount }, (_, i) => {
        const x = (i + 0.5) * SPACING;
        // Sag da catenária aproximado (peak central ~y=27 → bulbo abaixo do fio).
        const yOffset =
          Math.sin((i / Math.max(1, lampCount - 1)) * Math.PI) * 9;
        const delay = (i * 0.41) % 3;
        return (
          <div
            key={i}
            className="varal-lamp-wrapper"
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${17 + yOffset}px`,
              transform: "translate(-50%, 0)",
            }}
          >
            <Lamp index={i} delay={delay} />
          </div>
        );
      })}
    </div>
  );
}

function Lamp({ index, delay }: { index: number; delay: number }) {
  const haloId = `varal-halo-${index}`;
  const glassId = `varal-glass-${index}`;
  const capId = `varal-cap-${index}`;
  return (
    <svg
      width={LAMP_W}
      height={LAMP_H}
      viewBox={`0 0 ${LAMP_W} ${LAMP_H}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={haloId} cx="50%" cy="65%" r="55%">
          <stop offset="0%" stopColor="rgba(255, 230, 140, 0.9)" />
          <stop offset="50%" stopColor="rgba(212, 176, 86, 0.35)" />
          <stop offset="100%" stopColor="rgba(212, 176, 86, 0)" />
        </radialGradient>
        <radialGradient id={glassId} cx="38%" cy="50%" r="62%">
          <stop offset="0%" stopColor="#FFF4C2" />
          <stop offset="40%" stopColor="#FFD96A" />
          <stop offset="80%" stopColor="#D4845D" />
          <stop offset="100%" stopColor="#7B3F22" />
        </radialGradient>
        <linearGradient id={capId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3D2418" />
          <stop offset="35%" stopColor="#A0843E" />
          <stop offset="70%" stopColor="#7B5A2A" />
          <stop offset="100%" stopColor="#3D2418" />
        </linearGradient>
      </defs>

      {/* Halo radial pulsante */}
      <circle
        cx={LAMP_W / 2}
        cy={22}
        r="18"
        fill={`url(#${haloId})`}
        className="varal-halo-anim"
        style={{ animationDelay: `${delay}s` }}
      />

      {/* Soquete (cap de bronze) */}
      <rect
        x="7"
        y="2"
        width="8"
        height="6"
        rx="0.6"
        fill={`url(#${capId})`}
        stroke="#1A0F09"
        strokeWidth="0.35"
      />
      {/* Roscas */}
      <line x1="7.4" y1="3.6" x2="14.6" y2="3.6" stroke="#1A0F09" strokeWidth="0.3" opacity="0.85" />
      <line x1="7.4" y1="5.2" x2="14.6" y2="5.2" stroke="#1A0F09" strokeWidth="0.3" opacity="0.85" />
      <line x1="7.4" y1="6.8" x2="14.6" y2="6.8" stroke="#1A0F09" strokeWidth="0.3" opacity="0.85" />
      {/* Highlight no soquete */}
      <line x1="7.6" y1="2.6" x2="7.6" y2="7.4" stroke="rgba(255,224,170,0.6)" strokeWidth="0.4" />

      {/* Pescoço estreito (entre soquete e bulbo) */}
      <path
        d="M 8.4 8 L 13.6 8 L 13 11 L 9 11 Z"
        fill={`url(#${glassId})`}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.3"
      />

      {/* Bulbo Edison (formato pera) */}
      <g className="varal-bulb-anim" style={{ animationDelay: `${delay}s` }}>
        <path
          d="M 9 11 Q 2 14 2 22 Q 2 31 11 31 Q 20 31 20 22 Q 20 14 13 11 Z"
          fill={`url(#${glassId})`}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.45"
        />
        {/* Brilho lateral esquerdo */}
        <ellipse
          cx="5"
          cy="18"
          rx="1.3"
          ry="3.4"
          fill="rgba(255,255,255,0.55)"
        />
        {/* Brilho menor inferior */}
        <ellipse
          cx="14"
          cy="27"
          rx="0.9"
          ry="1.4"
          fill="rgba(255,255,255,0.35)"
        />
      </g>

      {/* Hastes do filamento (descem do soquete) */}
      <line x1="9.5" y1="11" x2="9.5" y2="16" stroke="#3D2418" strokeWidth="0.45" />
      <line x1="12.5" y1="11" x2="12.5" y2="16" stroke="#3D2418" strokeWidth="0.45" />

      {/* Filamento em zigue-zague (incandescente) */}
      <path
        d="M 9.5 16 L 10.5 22 L 11 17 L 11.5 22 L 12.5 16"
        fill="none"
        stroke="#FFF4C2"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="varal-filament-anim"
        style={{ animationDelay: `${delay}s` }}
      />
      {/* Glow do filamento (sob ele, mais largo e suave) */}
      <path
        d="M 9.5 16 L 10.5 22 L 11 17 L 11.5 22 L 12.5 16"
        fill="none"
        stroke="rgba(255, 224, 138, 0.55)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
