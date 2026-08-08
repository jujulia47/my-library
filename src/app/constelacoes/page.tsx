import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getConstellations } from "@/services/constellationsData";
import { ConstelacoesClient } from "@/components/Constellations/ConstelacoesClient";

export const metadata: Metadata = {
  title: "Constelações · My Library",
};

export const dynamic = "force-dynamic";

export default async function ConstelacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getConstellations(user.id);

  return (
    <AppShell>
      <ConstelacoesClient data={data} />
    </AppShell>
  );
}
