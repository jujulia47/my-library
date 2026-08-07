"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import type { FingerprintGenre } from "@/services/fingerprintData";

/** Paleta café — cada gênero ocupa uma fatia angular. */
export const FINGERPRINT_PALETTE = [
  "#6D3914",
  "#4A6B4E",
  "#2C5078",
  "#9B4722",
  "#7A4A6E",
  "#386661",
  "#8C6E1C",
  "#82393A",
];

type Props = {
  genres: FingerprintGenre[];
  books: number;
  pages: number;
  countries: number;
  rating: number | null;
  /** Ref opcional pro canvas (exportar como PNG). */
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  className?: string;
};

type RGB = [number, number, number];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
const GOLD: RGB = [201, 162, 78];

function hexToRgb(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(rgb: RGB, target: RGB, amt: number): RGB {
  return rgb.map((c, i) => Math.round(c + (target[i] - c) * amt)) as RGB;
}
function rgba(rgb: RGB, a: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

/**
 * Impressão digital de leitura — roseta concêntrica gerada dos dados.
 * A estrutura é sempre regular (pétalas espaçadas uniformemente); só a
 * cor (gêneros), o número de camadas (páginas), a densidade (livros), o
 * brilho/opacidade (nota) e a órbita (países) mudam com os dados. Assim
 * nunca "fica feio": é sempre uma mandala equilibrada.
 */
export function ReadingFingerprint({
  genres,
  books,
  pages,
  countries,
  rating,
  canvasRef,
  className,
}: Props) {
  const innerRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  // Dados atuais num ref pro loop de animação sempre ler o mais recente.
  const dataRef = useRef({ genres, books, pages, countries, rating });
  dataRef.current = { genres, books, pages, countries, rating };

  useEffect(() => {
    const cv = innerRef.current;
    if (canvasRef) canvasRef.current = cv;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let S = 400;

    function resize() {
      if (!cv) return;
      const r = cv.getBoundingClientRect();
      S = Math.min(r.width, r.height) || 400;
      cv.width = S * dpr;
      cv.height = S * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function wedgeColorFn(genres: FingerprintGenre[]) {
      if (genres.length === 0) {
        const only = hexToRgb(FINGERPRINT_PALETTE[0]);
        return () => only;
      }
      const total = genres.reduce((s, g) => s + g.count, 0) || 1;
      const stops: { end: number; rgb: RGB }[] = [];
      let acc = 0;
      genres.forEach((g, i) => {
        const frac = g.count / total;
        stops.push({
          end: acc + frac,
          rgb: hexToRgb(FINGERPRINT_PALETTE[i % FINGERPRINT_PALETTE.length]),
        });
        acc += frac;
      });
      return (ang: number): RGB => {
        let f = (ang / (Math.PI * 2)) % 1;
        if (f < 0) f += 1;
        for (const s of stops) if (f <= s.end + 1e-6) return s.rgb;
        return stops[stops.length - 1].rgb;
      };
    }

    function petal(
      R: number,
      ang: number,
      len: number,
      wid: number,
      fill: RGB,
      stroke: RGB,
      a: number,
    ) {
      ctx!.save();
      ctx!.rotate(ang);
      ctx!.translate(R, 0);
      ctx!.beginPath();
      ctx!.moveTo(0, 0);
      ctx!.quadraticCurveTo(len * 0.42, -wid, len, 0);
      ctx!.quadraticCurveTo(len * 0.42, wid, 0, 0);
      ctx!.closePath();
      ctx!.fillStyle = rgba(fill, a);
      ctx!.fill();
      ctx!.lineWidth = 0.7;
      ctx!.strokeStyle = rgba(stroke, a * 0.4);
      ctx!.stroke();
      ctx!.restore();
    }

    function draw(prog: number, rot: number) {
      const d = dataRef.current;
      ctx!.clearRect(0, 0, S, S);

      // Fundo café desenhado no canvas — assim o PNG exportado sai com base
      // (não transparente) e igual ao que se vê na tela.
      const bg = ctx!.createRadialGradient(
        S * 0.5,
        S * 0.46,
        0,
        S * 0.5,
        S * 0.5,
        S * 0.72,
      );
      bg.addColorStop(0, "#f6efdd");
      bg.addColorStop(1, "#e7dcc0");
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, S, S);

      const C = S / 2;
      const colorAt = wedgeColorFn(d.genres);
      const domRgb = hexToRgb(FINGERPRINT_PALETTE[0]);
      const rate = d.rating ?? 3.5;
      const k = Math.max(10, Math.min(18, Math.round(9 + d.books / 5)));
      const rings = Math.max(3, Math.min(6, Math.round(2 + d.pages / 4000)));
      const alpha = Math.max(0.42, Math.min(0.9, 0.55 + (rate - 3) * 0.13));
      const coreR = S * 0.052;
      const step = S * 0.058;
      const len = step * 1.42;
      const wid = step * 0.52;

      ctx!.save();
      ctx!.translate(C, C);
      ctx!.rotate(rot);

      // brilho pela nota
      const glowA = (Math.max(0, rate - 3) / 2) * 0.3;
      if (glowA > 0.01) {
        const g = ctx!.createRadialGradient(0, 0, coreR, 0, 0, S * 0.48);
        g.addColorStop(0, rgba(mix(domRgb, WHITE, 0.3), glowA));
        g.addColorStop(1, rgba(domRgb, 0));
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(0, 0, S * 0.48, 0, 7);
        ctx!.fill();
      }

      // anéis de pétalas (regulares) — só a cor varia
      for (let r = 0; r < rings; r++) {
        let rp = Math.max(0, Math.min(1, (prog - r * 0.1) / 0.62));
        rp = 1 - Math.pow(1 - rp, 3);
        if (rp <= 0) continue;
        const R = coreR + (r + 0.5) * step;
        const lift = r / (rings - 1 || 1);
        const petals = k;
        const offset = r % 2 ? Math.PI / petals : 0;
        for (let i = 0; i < petals; i++) {
          const ang = i * ((Math.PI * 2) / petals) + offset;
          const base = colorAt(ang);
          const fill = mix(base, WHITE, 0.12 + lift * 0.34);
          const stroke = mix(base, BLACK, 0.25);
          petal(
            R,
            ang,
            len * rp * (0.82 + 0.18 * (1 - lift)),
            wid * rp,
            fill,
            stroke,
            alpha,
          );
        }
      }

      // órbita de países
      const nC = Math.max(0, Math.min(22, d.countries));
      const orbR = coreR + (rings + 0.15) * step;
      for (let c = 0; c < nC; c++) {
        const caang = c * ((Math.PI * 2) / nC) + rot * 0.5;
        const cx = Math.cos(caang) * orbR;
        const cy = Math.sin(caang) * orbR;
        const pr2 = Math.max(0, Math.min(1, (prog - 0.5) / 0.5));
        ctx!.globalAlpha = pr2;
        ctx!.beginPath();
        ctx!.arc(cx, cy, S * 0.012, 0, 7);
        ctx!.fillStyle = rgba(GOLD, 0.28);
        ctx!.fill();
        ctx!.beginPath();
        ctx!.arc(cx, cy, S * 0.006, 0, 7);
        ctx!.fillStyle = rgba(GOLD, 1);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      // núcleo
      const core = ctx!.createRadialGradient(
        -coreR * 0.3,
        -coreR * 0.3,
        1,
        0,
        0,
        coreR * 1.5,
      );
      core.addColorStop(0, rgba(mix(domRgb, WHITE, 0.5), 1));
      core.addColorStop(1, rgba(domRgb, 1));
      ctx!.beginPath();
      ctx!.arc(0, 0, coreR, 0, 7);
      ctx!.fillStyle = core;
      ctx!.fill();
      ctx!.lineWidth = 1.4;
      ctx!.strokeStyle = rgba(GOLD, 0.9);
      ctx!.stroke();

      // estrela do núcleo
      ctx!.fillStyle = rgba(WHITE, 0.9);
      ctx!.beginPath();
      for (let s = 0; s < 10; s++) {
        const ra = s % 2 ? coreR * 0.34 : coreR * 0.74;
        const aa = -Math.PI / 2 + (s * Math.PI) / 5;
        const x = Math.cos(aa) * ra;
        const y = Math.sin(aa) * ra;
        if (s) ctx!.lineTo(x, y);
        else ctx!.moveTo(x, y);
      }
      ctx!.closePath();
      ctx!.fill();

      ctx!.restore();
    }

    let raf = 0;
    const growStart = performance.now();
    let rot = 0;
    let last = 0;

    function frame(t: number) {
      if (!last) last = t;
      const dt = (t - last) / 1000;
      last = t;
      const prog = reduced ? 1 : Math.min(1, (t - growStart) / 1200);
      if (!reduced) rot += dt * 0.04;
      draw(prog, reduced ? 0 : rot);
      if (!reduced || prog < 1) raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);

    let rz: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(rz);
      rz = setTimeout(resize, 120);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      clearTimeout(rz);
    };
  }, [reduced, canvasRef]);

  return <canvas ref={innerRef} className={className} aria-label="Impressão digital de leitura" />;
}
