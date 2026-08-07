"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import type { AntiBook } from "@/services/antibibliotecaData";
import styles from "./antibiblioteca.module.css";

type RGB = [number, number, number];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

function hexToRgb(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(rgb: RGB, t: RGB, a: number): RGB {
  return rgb.map((c, i) => Math.round(c + (t[i] - c) * a)) as RGB;
}
function rgba(rgb: RGB, a: number) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

type Props = {
  pool: AntiBook[];
  /** Muda de valor a cada pedido de giro. */
  spinKey: number;
  onLand: (book: AntiBook) => void;
};

/** Roleta física: segmentos coloridos por gênero, giro com desaceleração. */
export function RoletaWheel({ pool, spinKey, onLand }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const rotRef = useRef(0);
  const winnerRef = useRef(-1);
  const reduced = useReducedMotion();
  const [caption, setCaption] = useState("girando…");
  const [pulse, setPulse] = useState(false);

  // desenha um frame na rotação atual
  function draw() {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = cv.getBoundingClientRect().width || 340;
    if (cv.width !== size * dpr) {
      cv.width = size * dpr;
      cv.height = size * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const books = poolRef.current;
    const N = books.length;
    ctx.clearRect(0, 0, size, size);
    if (!N) return;
    const C = size / 2;
    const R = size * 0.475;
    const seg = (Math.PI * 2) / N;
    ctx.save();
    ctx.translate(C, C);
    ctx.rotate(rotRef.current);
    for (let i = 0; i < N; i++) {
      const a0 = -Math.PI / 2 + i * seg;
      const a1 = a0 + seg;
      const rgb = hexToRgb(books[i].color);
      const j = ((i % 3) - 1) * 0.07;
      const fill =
        i === winnerRef.current
          ? mix(rgb, WHITE, 0.42)
          : j >= 0
            ? mix(rgb, WHITE, j)
            : mix(rgb, BLACK, -j);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = rgba(fill, 1);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(201,162,78,.5)";
      ctx.stroke();
      if (N <= 14) {
        ctx.save();
        ctx.rotate(a0 + seg / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(247,238,216,.94)";
        ctx.font = `600 ${Math.round(size * 0.033)}px Georgia, serif`;
        let lab = books[i].title;
        if (lab.length > 20) lab = lab.slice(0, 19) + "…";
        ctx.fillText(lab, R - 12, 0);
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(C, C, R, 0, 7);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#c9a24e";
    ctx.stroke();
  }

  // giro a cada spinKey
  useEffect(() => {
    const books = poolRef.current;
    const N = books.length;
    if (!N) return;
    setCaption("girando…");
    winnerRef.current = -1;
    const seg = (Math.PI * 2) / N;
    const pick = Math.floor(Math.random() * N);
    const base = -(pick * seg + seg / 2);

    if (reduced) {
      rotRef.current = base;
      winnerRef.current = pick;
      draw();
      setCaption("✦ escolhido");
      onLand(books[pick]);
      return;
    }

    let target = base;
    while (rotRef.current - target < Math.PI * 2 * 5) target -= Math.PI * 2;
    const from = rotRef.current;
    const dur = 3600;
    let t0 = 0;
    let raf = 0;
    let landed = false;

    function tick(t: number) {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3.2);
      rotRef.current = from + (target - from) * e;
      draw();
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!landed) {
        landed = true;
        winnerRef.current = pick;
        draw();
        setCaption("✦ escolhido");
        setPulse(false);
        requestAnimationFrame(() => setPulse(true));
        setTimeout(() => onLand(books[pick]), 650);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey, reduced]);

  // redesenha em resize
  useEffect(() => {
    function onResize() {
      draw();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.wheelStage}>
      <div className={styles.wheelHolder}>
        <div className={styles.wheelPointer} />
        <canvas ref={canvasRef} className={styles.wheel} />
        <div className={`${styles.wheelHub} ${pulse ? styles.pulse : ""}`}>
          <span>🎲</span>
        </div>
      </div>
      <p className={styles.reelCap}>{caption}</p>
    </div>
  );
}
