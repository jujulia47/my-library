"use client";

import { useRef, type PointerEvent } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import type {
  AchievementsData,
  Achievement,
} from "@/services/achievementsData";
import { Seal } from "./Seal";
import styles from "./conquistas.module.css";

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function earnedLabel(iso: string | null): string {
  if (!iso) return "conquistado";
  const [y, m] = iso.split("-");
  return `conquistado em ${MONTHS[Number(m) - 1]}/${y.slice(2)}`;
}

export function ConquistasClient({ data }: { data: AchievementsData }) {
  const reduced = useReducedMotion();
  const pct =
    data.totalCount > 0
      ? Math.round((data.unlockedCount / data.totalCount) * 100)
      : 0;

  let idx = 0; // índice global pro stagger de entrada

  return (
    <div className={styles.wrap}>
      {/* filtro de cera — definido uma vez */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="wax">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.11"
            numOctaves="2"
            seed="4"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" />
        </filter>
      </svg>

      <p className={styles.eyebrow}>Conquistas</p>
      <h1 className={styles.title}>Seus selos</h1>
      <p className={styles.lead}>
        Marcos da sua leitura, lacrados em cera. Alguns você já conquistou;
        outros mostram o quanto falta. Cada selo tem seu emblema e sua
        categoria.
      </p>

      <div className={styles.top}>
        <div className={styles.progressWide}>
          <div className={styles.progN}>
            <b>{data.unlockedCount}</b> de {data.totalCount} conquistas lacradas
          </div>
          <div className={styles.progBar}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {data.categories.map((cat) => (
        <section className={styles.cat} key={cat.name}>
          <p className={styles.catLabel}>
            <b>{cat.name}</b>
          </p>
          <div className={styles.grid}>
            {cat.items.map((a) => (
              <Badge
                key={a.key}
                a={a}
                color={cat.color}
                delay={reduced ? 0 : Math.min(idx++ * 40, 600)}
                reduced={reduced}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Badge({
  a,
  color,
  delay,
  reduced,
}: {
  a: Achievement;
  color: string;
  delay: number;
  reduced: boolean;
}) {
  const sealRef = useRef<SVGSVGElement | null>(null);
  const locked = !a.unlocked;
  const progress = Math.min(100, Math.round((a.cur / a.goal) * 100));

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    const seal = sealRef.current;
    if (!seal) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    seal.style.setProperty("--ry", `${(nx * 18).toFixed(1)}deg`);
    seal.style.setProperty("--rx", `${(-ny * 18).toFixed(1)}deg`);
  }
  function onLeave() {
    const seal = sealRef.current;
    if (!seal) return;
    seal.style.setProperty("--ry", "0deg");
    seal.style.setProperty("--rx", "0deg");
  }

  return (
    <div
      className={`${styles.badge} ${locked ? styles.locked : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={styles.sealWrap}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <Seal
          className={styles.seal}
          color={color}
          glyph={a.glyph}
          locked={locked}
          gradId={`grad-${a.key}`}
        />
        {locked && (
          <span className={styles.lock} aria-hidden>
            🔒
          </span>
        )}
      </div>
      <h3 className={styles.badgeName}>{a.name}</h3>
      <p className={styles.desc}>{a.desc}</p>
      {locked ? (
        <>
          <div className={styles.prog}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.hint}>
            {a.hint} · {a.cur.toLocaleString("pt-BR")}/
            {a.goal.toLocaleString("pt-BR")}
          </p>
        </>
      ) : (
        <p className={styles.earned}>{earnedLabel(a.earned)}</p>
      )}
    </div>
  );
}
