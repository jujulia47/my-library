import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getTodayData } from "@/services/todayData";
import { formatLongDateWithWeekday } from "@/utils/formatDate";
import { TodayLogForm } from "@/components/Today/TodayLogForm";
import { TodayActivityFeed } from "@/components/Today/TodayActivityFeed";
import { SectionLabel } from "@/components/Home/SectionLabel";

export const metadata: Metadata = {
  title: "Diário de hoje · My Library",
};

// Página `/today` é sensível a hora — não cachear, sempre recalcular.
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getTodayData(user.id);
  const dateLabel = formatLongDateWithWeekday(data.date);

  return (
    <AppShell>
      {/* Cabeçalho de página de diário — data por extenso em destaque, sem
          stats nem decoração. */}
      <header className="mb-8 pb-6 border-b border-border">
        <p className="font-body text-xs uppercase tracking-[0.25em] text-ink-fade">
          Diário do dia
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink-deep mt-1 leading-tight">
          {dateLabel}
        </h1>
      </header>

      <section className="mb-8">
        <SectionLabel>O que você leu hoje?</SectionLabel>
        <TodayLogForm readings={data.active_readings} />
      </section>

      <section className="mb-12">
        <SectionLabel>
          {data.activities.length === 0
            ? "Atividade de hoje"
            : `Atividade de hoje · ${data.activities.length} ${
                data.activities.length === 1 ? "entrada" : "entradas"
              }`}
        </SectionLabel>
        <TodayActivityFeed activities={data.activities} />
      </section>
    </AppShell>
  );
}
