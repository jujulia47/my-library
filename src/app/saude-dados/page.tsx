import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getDataHealth } from "@/services/dataHealthData";
import { DataHealthClient } from "@/components/DataHealth/DataHealthClient";

export const metadata: Metadata = {
  title: "Saúde do acervo · My Library",
};

export const dynamic = "force-dynamic";

export default async function SaudeDadosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getDataHealth(user.id);

  return (
    <AppShell>
      <DataHealthClient data={data} />
    </AppShell>
  );
}
