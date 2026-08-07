import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getAchievements } from "@/services/achievementsData";
import { ConquistasClient } from "@/components/Achievements/ConquistasClient";

export const metadata: Metadata = {
  title: "Conquistas · My Library",
};

export const dynamic = "force-dynamic";

export default async function ConquistasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getAchievements(user.id);

  return (
    <AppShell>
      <ConquistasClient data={data} />
    </AppShell>
  );
}
