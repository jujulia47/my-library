import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getReadingPlan } from "@/services/readingPlanData";
import ReadingPlanClient from "@/components/Plan/ReadingPlanClient";

export const metadata: Metadata = {
  title: "Plano de leitura · My Library",
};

// Sensível à data (mês corrente, meta "faltam X dias") — sempre recalcula.
export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getUTCFullYear();
  const monthRaw = Number(sp.month) || now.getUTCMonth() + 1;
  const month = Math.min(12, Math.max(1, monthRaw));

  const data = await getReadingPlan(user.id, year, month);

  return (
    <AppShell>
      {/* key por mês: força remontar ao navegar entre meses, pra o estado
          local (books) não ficar preso no mês anterior. */}
      <ReadingPlanClient
        key={`${year}-${month}`}
        data={data}
        todayISO={todayISO()}
      />
    </AppShell>
  );
}
