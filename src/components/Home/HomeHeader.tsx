import Link from "next/link";
import { HomeOrnaments } from "./HomeOrnaments";
import type { HomeData } from "@/services/homeData";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  const prefix =
    hour >= 5 && hour < 12
      ? "Bom dia"
      : hour >= 12 && hour < 18
        ? "Boa tarde"
        : "Boa noite";
  return `${prefix}, Júlia`;
}

function formatDateBR(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.getDate();
  return `${day} de ${MONTHS[date.getMonth()]}`;
}

type Props = {
  currentYear: number;
  today: string;
  lastActivity: HomeData["last_activity"];
};

export function HomeHeader({
  currentYear,
  today,
  lastActivity,
}: Props) {
  const greeting = getGreeting();
  const dateLabel = formatDateBR(today);

  return (
    <header
      className="relative pb-5 mb-2 pt-12"
      style={{
        borderBottom: "1px solid transparent",
        backgroundImage:
          "linear-gradient(to bottom, transparent, transparent), linear-gradient(to right, transparent 0%, var(--color-border) 30%, var(--color-border) 70%, transparent 100%)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      {/* Sessão 17.10: ornamento vintage no topo (substitui o varal de luzes
          — que pertence à metáfora da biblioteca, não da home). */}
      <HomeOrnaments />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] font-medium text-ink-deep leading-tight">
            {greeting}
          </h1>
          <p className="font-body text-xs italic text-ink-fade mt-0.5">
            Resumo do seu ano · {currentYear}
          </p>
        </div>

        <div className="relative flex flex-col items-end text-right pr-0 sm:pr-16">
          <svg
            width="56"
            height="48"
            viewBox="0 0 56 48"
            aria-hidden
            className="hidden sm:block absolute -top-1 right-0 pointer-events-none"
            style={{ opacity: 0.35 }}
          >
            <rect x="6" y="20" width="6" height="22" fill="#6B5240" rx="1" />
            <rect x="14" y="14" width="6" height="28" fill="#993C1D" rx="1" />
            <rect x="22" y="18" width="6" height="24" fill="#3B6D11" rx="1" />
            <rect x="30" y="10" width="6" height="32" fill="#185FA5" rx="1" />
            <rect x="38" y="22" width="6" height="20" fill="#993556" rx="1" />
            <rect x="46" y="16" width="6" height="26" fill="#534AB7" rx="1" />
            <rect x="3" y="42" width="50" height="3" fill="#854F0B" />
          </svg>
          <p className="font-body text-sm text-ink-soft">{dateLabel}</p>
          {lastActivity && (
            <p className="font-body text-xs text-ink-fade mt-0.5">
              última atividade {lastActivity.relative_time} ·{" "}
              <Link
                href={`/book/${lastActivity.book_slug}`}
                className="italic hover:text-gold-deep transition-colors"
              >
                {lastActivity.book_title}
              </Link>
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
