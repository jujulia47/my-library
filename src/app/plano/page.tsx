import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getReadingPlan } from "@/services/readingPlanData";
import { todayISO, normalizeMonthParam } from "@/utils/dates";
import ReadingPlanClient from "@/components/Plan/ReadingPlanClient";

export const metadata: Metadata = {
  title: "Plano de leitura · My Library",
};

// Sensível à data (tudo deriva de "hoje") — sempre recalcula.
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ mes?: string }>;
};

export default async function PlanoPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { mes } = await searchParams;
  const monthISO = normalizeMonthParam(mes ?? null) ?? undefined;
  const data = await getReadingPlan(user.id, monthISO);

  return (
    <AppShell>
      <ReadingPlanClient data={data} todayISO={todayISO()} />
    </AppShell>
  );
}
