import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getTodayData } from "@/services/todayData";
import { formatLongDateWithWeekday } from "@/utils/formatDate";
import { TodayLogForm } from "@/components/Today/TodayLogForm";
import { TodayActivityFeed } from "@/components/Today/TodayActivityFeed";
import { SectionLabel } from "@/components/Home/SectionLabel";

export const metadata: Metadata = {
  title: "Diário · My Library",
};

// Página `/today` é sensível a hora — não cachear, sempre recalcular.
export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** YYYY-MM-DD aritmética em UTC — evita pulos de horário de verão. */
function shiftDate(iso: string, deltaDays: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const data = await getTodayData(user.id, sp.date);
  const dateLabel = formatLongDateWithWeekday(data.date);
  const today = todayISO();
  const isToday = data.date === today;

  // Links de navegação. "Próximo" só aparece se ainda não chegou em hoje.
  const prevHref = `/today?date=${shiftDate(data.date, -1)}`;
  const nextDate = shiftDate(data.date, 1);
  const nextHref = nextDate <= today ? `/today?date=${nextDate}` : null;
  // "Voltar pra hoje" — atalho quando estamos no histórico.
  const todayHref = "/today";

  return (
    <AppShell>
      {/* Cabeçalho de diário — data por extenso + nav arrows pra histórico. */}
      <header className="mb-8 pb-6 border-b border-border">
        <p className="font-body text-xs uppercase tracking-[0.25em] text-ink-fade">
          {isToday ? "Diário do dia" : "Diário"}
        </p>
        <div className="flex items-end justify-between gap-4 mt-1 flex-wrap">
          <h1 className="font-display text-3xl md:text-4xl text-ink-deep leading-tight">
            {dateLabel}
          </h1>
          <nav
            aria-label="Navegar entre dias"
            className="flex items-center gap-1.5 text-sm font-body"
          >
            <Link
              href={prevHref}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-ivory-light px-2.5 py-1.5 text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
              aria-label="Dia anterior"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Link>
            {!isToday && (
              <Link
                href={todayHref}
                className="inline-flex items-center rounded-md border border-[#6D3914]/40 bg-[#6D3914]/10 text-[#6D3914] px-2.5 py-1.5 hover:bg-[#6D3914]/15 transition-colors"
              >
                Hoje
              </Link>
            )}
            {nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-ivory-light px-2.5 py-1.5 text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
                aria-label="Próximo dia"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            ) : (
              <span
                aria-disabled
                className="inline-flex items-center gap-1 rounded-md border border-border bg-ivory-light px-2.5 py-1.5 text-ink-fade opacity-50 cursor-not-allowed"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRightIcon className="w-4 h-4" />
              </span>
            )}
          </nav>
        </div>
      </header>

      {/* Form de input só faz sentido em "hoje" — passado é só leitura. */}
      {isToday && (
        <section className="mb-8">
          <SectionLabel>O que você leu hoje?</SectionLabel>
          <TodayLogForm readings={data.active_readings} />
        </section>
      )}

      <section className="mb-12">
        <SectionLabel>
          {data.activities.length === 0
            ? isToday
              ? "Atividade de hoje"
              : "Sem atividade nesse dia"
            : `${isToday ? "Atividade de hoje" : "Atividade do dia"} · ${
                data.activities.length
              } ${data.activities.length === 1 ? "entrada" : "entradas"}`}
        </SectionLabel>
        <TodayActivityFeed activities={data.activities} />
      </section>
    </AppShell>
  );
}
