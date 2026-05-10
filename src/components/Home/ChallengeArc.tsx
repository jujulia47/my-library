"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomeActiveChallenge, HomePace } from "@/services/homeData";

const PACE_TEXT: Record<HomePace, string> = {
  moss: "text-moss",
  gold: "text-gold-deep",
  burgundy: "text-burgundy",
};

// Comprimento aproximado do arco semicircular do SVG (raio 45). Usado como
// "100%" da stroke-dasharray. ~141 ≈ π × 45.
const ARC_LENGTH = 141;

type Props = {
  challenge: HomeActiveChallenge;
  currentYear: number;
};

export function ChallengeArc({ challenge, currentYear }: Props) {
  const target = (challenge.progress_percent / 100) * ARC_LENGTH;
  const [animatedDash, setAnimatedDash] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const delay = 300;
    const duration = 1200;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedDash(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <Link
      href={`/collection/${challenge.slug}`}
      className="block bg-paper border border-paper-soft rounded-lg p-3.5 text-center hover:border-gold transition-colors duration-150"
    >
      <p className="text-xs uppercase tracking-wider text-ink-fade mb-2">
        Desafio {currentYear}
      </p>
      <svg
        viewBox="0 0 120 80"
        className="w-full"
        style={{ height: 70 }}
        aria-hidden
      >
        <defs>
          {/* Sessão 17.3: gradient burgundy-soft → gold → moss ao longo do
              arco. Conforme o stroke avança (animatedDash), revela cores
              correspondentes ao progresso: vermelho-suave no início (longe da
              meta), gold no meio (caminhando), moss perto do fim. */}
          <linearGradient id="challenge-progress" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-burgundy-soft)" />
            <stop offset="50%" stopColor="var(--color-gold)" />
            <stop offset="100%" stopColor="var(--color-moss)" />
          </linearGradient>
        </defs>
        <path
          d="M 15 70 A 45 45 0 0 1 105 70"
          fill="none"
          stroke="var(--color-paper-soft)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 15 70 A 45 45 0 0 1 105 70"
          fill="none"
          stroke="url(#challenge-progress)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${animatedDash} ${ARC_LENGTH}`}
        />
        <text
          x="60"
          y="55"
          textAnchor="middle"
          className="font-display"
          fontSize="20"
          fontWeight="500"
          fill="var(--color-ink-deep)"
        >
          {challenge.current_count}/{challenge.goal_count}
        </text>
        <text
          x="60"
          y="68"
          textAnchor="middle"
          fontSize="9"
          fill="var(--color-ink-fade)"
        >
          {challenge.progress_percent}%
        </text>
      </svg>
      <p className={`text-xs mt-1 italic ${PACE_TEXT[challenge.pace_color]}`}>
        <span className="not-italic font-medium">{challenge.pace_label}</span>{" "}
        · {challenge.pace_subtitle}
      </p>
    </Link>
  );
}
