"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import type {
  ConstellationsData,
  ConstellationStar,
} from "@/services/constellationsData";
import styles from "./constelacoes.module.css";

// Dimensões do "mundo" — iguais às do serviço (aqui é só client, não pode
// importar o valor do módulo server, que puxa next/headers).
const WORLD_W = 1600;
const WORLD_H = 1000;

type Star = ConstellationStar & { gi: number };

function toRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hexA(hex: string, a: number) {
  const c = toRgb(hex);
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

export function ConstelacoesClient({ data }: { data: ConstellationsData }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const genres = data.genres;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const stars = useMemo<Star[]>(
    () => genres.flatMap((g, gi) => g.stars.map((s) => ({ ...s, gi }))),
    [genres],
  );

  const [detail, setDetail] = useState<{ star: Star; gi: number } | null>(null);
  const [activeGenre, setActiveGenre] = useState<number>(-1); // pra legenda

  // Estado mutável do canvas (não dispara re-render).
  const view = useRef({ ox: 0, oy: 0, scale: 1 });
  const target = useRef<{ ox: number; oy: number; scale: number } | null>(null);
  const active = useRef(-1);
  const activeStart = useRef(0);
  const hoverStar = useRef<Star | null>(null);
  const legendLock = useRef(false);

  // Starfield de fundo (estável).
  const bg = useMemo(() => {
    let seed = 4242;
    const r = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return Array.from({ length: 320 }, () => ({
      x: r() * 2200 - 300,
      y: r() * 1400 - 200,
      s: r() * 1.4 + 0.3,
      p: r() * 6.28,
      b: 0.3 + r() * 0.5,
    }));
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !wrap || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;

    function fit() {
      const s = Math.min(W / WORLD_W, H / WORLD_H) * 0.92;
      view.current = {
        scale: s,
        ox: W / 2 - (WORLD_W / 2) * s,
        oy: H / 2 - (WORLD_H / 2) * s,
      };
    }
    function resize() {
      const rect = wrap!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      cv!.width = W * dpr;
      cv!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!view.current.scale || view.current.scale === 1) fit();
    }
    resize();
    fit();

    function w2s(x: number, y: number): [number, number] {
      const v = view.current;
      return [x * v.scale + v.ox, y * v.scale + v.oy];
    }
    function setActive(gi: number) {
      if (gi === active.current) return;
      active.current = gi;
      activeStart.current = performance.now();
    }

    let raf = 0;
    function draw(t: number) {
      const v = view.current;
      ctx!.clearRect(0, 0, W, H);

      // fundo em parallax (metade do deslocamento)
      const bo = { ox: v.ox * 0.5 + W * 0.25, oy: v.oy * 0.5 + H * 0.25, scale: v.scale };
      for (const b of bg) {
        const sx = b.x * bo.scale + bo.ox;
        const sy = b.y * bo.scale + bo.oy;
        if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) continue;
        const tw = reduced ? 1 : 0.7 + 0.3 * Math.sin(t * 0.001 + b.p);
        ctx!.globalAlpha = b.b * tw;
        ctx!.fillStyle = "#cdd6ea";
        ctx!.beginPath();
        ctx!.arc(sx, sy, b.s, 0, 7);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      // linhas + rótulos das constelações
      genres.forEach((g, gi) => {
        const isA = gi === active.current;
        const prog = isA && !reduced ? Math.min(1, (t - activeStart.current) / 800) : 1;
        ctx!.strokeStyle = g.star;
        ctx!.lineWidth = isA ? 1.4 : 1;
        ctx!.globalAlpha = isA ? 0.55 : 0.13;
        ctx!.beginPath();
        for (let i = 0; i < g.stars.length - 1; i++) {
          const a = w2s(g.stars[i].x, g.stars[i].y);
          const b = w2s(g.stars[i + 1].x, g.stars[i + 1].y);
          const seg = (g.stars.length - 1) * prog;
          if (i >= seg) break;
          const f = Math.min(1, seg - i);
          ctx!.moveTo(a[0], a[1]);
          ctx!.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
        }
        ctx!.stroke();
        const c = w2s(g.cx, g.cy);
        ctx!.globalAlpha = isA ? 0.85 : 0.34;
        ctx!.fillStyle = g.star;
        ctx!.font = `600 ${13 * Math.max(0.8, v.scale)}px Georgia, serif`;
        ctx!.textAlign = "center";
        ctx!.fillText(g.name, c[0], c[1] - 26 * v.scale);
      });
      ctx!.globalAlpha = 1;

      // estrelas
      for (const s of stars) {
        const p = w2s(s.x, s.y);
        const g = genres[s.gi];
        const isA = s.gi === active.current;
        const tw = reduced ? 1 : 0.75 + 0.25 * Math.sin(t * 0.0018 + s.phase);
        const R =
          s.size *
          (isA ? 1.25 : 1) *
          Math.max(0.75, v.scale) *
          (s === hoverStar.current ? 1.5 : 1);
        const a = s.bright * tw * (active.current < 0 || isA ? 1 : 0.5);
        const grd = ctx!.createRadialGradient(p[0], p[1], 0, p[0], p[1], R * 3.2);
        grd.addColorStop(0, `rgba(255,255,255,${a})`);
        grd.addColorStop(0.35, hexA(g.star, a));
        grd.addColorStop(1, hexA(g.star, 0));
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(p[0], p[1], R * 3.2, 0, 7);
        ctx!.fill();
        ctx!.fillStyle = `rgba(255,255,255,${Math.min(1, a + 0.2)})`;
        ctx!.beginPath();
        ctx!.arc(p[0], p[1], R * 0.6, 0, 7);
        ctx!.fill();
      }

      // tween de foco
      const tg = target.current;
      if (tg) {
        const k = 0.12;
        v.ox += (tg.ox - v.ox) * k;
        v.oy += (tg.oy - v.oy) * k;
        v.scale += (tg.scale - v.scale) * k;
        if (Math.abs(tg.scale - v.scale) < 0.001) target.current = null;
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    // ---- interação ----
    let dragging = false;
    let moved = false;
    let lx = 0;
    let ly = 0;

    function rel(e: PointerEvent | WheelEvent) {
      const rect = cv!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function showTip(s: Star, x: number, y: number) {
      const tip = tipRef.current;
      if (!tip) return;
      (tip.querySelector("[data-tt]") as HTMLElement).textContent = s.title;
      (tip.querySelector("[data-ta]") as HTMLElement).textContent =
        `${s.author ? s.author + " · " : ""}${genres[s.gi].name}`;
      tip.style.left = Math.min(W - 232, x + 16) + "px";
      tip.style.top = y + 16 + "px";
      tip.classList.add(styles.tipShow);
    }
    function hideTip() {
      tipRef.current?.classList.remove(styles.tipShow);
    }
    function hoverTest(mx: number, my: number) {
      let best: Star | null = null;
      let bestD = 1e9;
      for (const s of stars) {
        const p = w2s(s.x, s.y);
        const dx = p[0] - mx;
        const dy = p[1] - my;
        const d = dx * dx + dy * dy;
        const rad = s.size * Math.max(0.75, view.current.scale) + 12;
        if (d < rad * rad && d < bestD) {
          bestD = d;
          best = s;
        }
      }
      hoverStar.current = best;
      if (best) {
        setActive(best.gi);
        showTip(best, mx, my);
        cv!.style.cursor = "pointer";
      } else {
        if (!legendLock.current) setActive(-1);
        hideTip();
        cv!.style.cursor = dragging ? "grabbing" : "grab";
      }
    }

    function onDown(e: PointerEvent) {
      dragging = true;
      moved = false;
      lx = e.clientX;
      ly = e.clientY;
      cv!.setPointerCapture(e.pointerId);
      target.current = null;
    }
    function onMove(e: PointerEvent) {
      const { x, y } = rel(e);
      if (dragging) {
        const dx = e.clientX - lx;
        const dy = e.clientY - ly;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        view.current.ox += dx;
        view.current.oy += dy;
        lx = e.clientX;
        ly = e.clientY;
        hideTip();
      } else {
        hoverTest(x, y);
      }
    }
    function onUp(e: PointerEvent) {
      dragging = false;
      const { x, y } = rel(e);
      if (!moved) {
        hoverTest(x, y);
        if (hoverStar.current) {
          const s = hoverStar.current;
          setDetail({ star: s, gi: s.gi });
        } else {
          setDetail(null);
        }
      }
    }
    function onLeave() {
      dragging = false;
      hideTip();
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const { x, y } = rel(e);
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const ns = Math.max(0.45, Math.min(2.8, view.current.scale * f));
      const k = ns / view.current.scale;
      view.current.ox = x - (x - view.current.ox) * k;
      view.current.oy = y - (y - view.current.oy) * k;
      view.current.scale = ns;
    }

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Expor foco de gênero pra legenda via evento custom.
    function focusGenre(i: number) {
      const g = genres[i];
      const s = 1.5;
      target.current = { scale: s, ox: W / 2 - g.cx * s, oy: H / 2 - g.cy * s };
    }
    function fitTarget() {
      const s = Math.min(W / WORLD_W, H / WORLD_H) * 0.92;
      target.current = {
        scale: s,
        ox: W / 2 - (WORLD_W / 2) * s,
        oy: H / 2 - (WORLD_H / 2) * s,
      };
    }
    const handler = (ev: Event) => {
      const i = (ev as CustomEvent<number>).detail;
      if (legendLock.current && active.current === i) {
        legendLock.current = false;
        setActive(-1);
        setActiveGenre(-1);
        fitTarget();
      } else {
        legendLock.current = true;
        setActive(i);
        setActiveGenre(i);
        focusGenre(i);
      }
    };
    wrap.addEventListener("focus-genre", handler);

    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("focus-genre", handler);
      ro.disconnect();
    };
  }, [genres, stars, bg, reduced]);

  function clickLegend(i: number) {
    wrapRef.current?.dispatchEvent(new CustomEvent("focus-genre", { detail: i }));
  }

  if (data.bookCount === 0) {
    return (
      <div className={styles.empty}>
        Seu céu aparece quando você terminar livros com um gênero cadastrado —
        cada gênero vira uma constelação.
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Constelações da biblioteca</p>
        <h1 className={styles.title}>Seu céu de livros</h1>
        <p className={styles.hint}>
          Cada gênero é uma constelação · estrelas maiores = livros mais longos,
          mais brilhantes = melhor nota. Arraste pra navegar · scroll pra
          aproximar · clique numa estrela.
        </p>
      </div>

      <div className={styles.sky} ref={wrapRef}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.vignette} />

        <div className={styles.legend}>
          {genres.map((g, i) => (
            <button
              key={g.name}
              className={styles.lg}
              style={{ color: g.star }}
              aria-current={activeGenre === i}
              onClick={() => clickLegend(i)}
            >
              <span className={styles.lgDot} style={{ background: g.star }} />
              <span className={styles.lgName}>{g.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.tooltip} ref={tipRef}>
          <div className={styles.tt} data-tt />
          <div className={styles.ta} data-ta />
        </div>

        {detail && (
          <div className={`${styles.detail} ${styles.detailShow}`}>
            <button
              className={styles.dClose}
              onClick={() => setDetail(null)}
              aria-label="Fechar"
            >
              ✕
            </button>
            <span className={styles.dg}>
              <span
                className={styles.dgDot}
                style={{ background: genres[detail.gi].star }}
              />
              {genres[detail.gi].name}
            </span>
            <h3 className={styles.dTitle}>{detail.star.title}</h3>
            <p className={styles.dm}>
              {detail.star.author ? `${detail.star.author} · ` : ""}
              {detail.star.pages ? `${detail.star.pages} páginas` : "sem nº de páginas"}
            </p>
            {detail.star.rating != null && (
              <p className={styles.dr}>
                {"★".repeat(detail.star.rating)}
                {"☆".repeat(5 - detail.star.rating)}
              </p>
            )}
            <button
              className={styles.open}
              onClick={() => router.push(`/book/${detail.star.slug}`)}
            >
              abrir livro →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
