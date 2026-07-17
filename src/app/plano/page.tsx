import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getReadingPlan } from "@/services/readingPlanData";
import { todayISO } from "@/utils/dates";
import ReadingPlanClient from "@/components/Plan/ReadingPlanClient";

export const metadata: Metadata = {
  title: "Plano de leitura · My Library",
};

// Sensível à data (tudo deriva de "hoje") — sempre recalcula.
export const dynamic = "force-dynamic";

export default async function PlanoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getReadingPlan(user.id);

  return (
    <AppShell>
      <ReadingPlanClient data={data} todayISO={todayISO()} />
    </AppShell>
  );
}
