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
      className="relative pb-5 mb-2 pt-12 px-4 sm:px-6 lg:px-8"
      style={{
        borderBottom: "1px solid transparent",
        // Gradiente: transparente só nos cantos extremos (0-8% e 92-100%),
        // colorido em quase toda a extensão da linha — antes os 30% laterais
        // ficavam invisíveis, sumindo sob o texto "Bom dia" e "14 de maio".
        backgroundImage:
          "linear-gradient(to bottom, transparent, transparent), linear-gradient(to right, transparent 0%, var(--color-border) 20%, var(--color-border) 80%, transparent 100%)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      {/* Sessão 17.10: ornamento vintage no topo (substitui o varal de luzes
          — que pertence à metáfora da biblioteca, não da home). */}
      <HomeOrnaments />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] md:text-3xl font-medium text-ink-deep leading-tight">
            {greeting}
          </h1>
          <p className="font-body text-xs md:text-sm italic text-ink-fade mt-0.5 md:mt-1">
            Resumo do seu ano · {currentYear}
          </p>
        </div>

        <div className="flex flex-col items-end text-right">
          <p className="font-body text-sm md:text-base text-ink-soft">
            {dateLabel}
          </p>
          {lastActivity && (
            <p className="font-body text-xs md:text-sm text-ink-fade mt-0.5 md:mt-1">
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
