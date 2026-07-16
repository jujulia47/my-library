import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Plano de leitura · My Library",
};

export const dynamic = "force-dynamic";

// Página em reconstrução — a implementação anterior foi removida e o novo
// modelo (metas + capacidade + fila) será construído do zero.
export default async function PlanoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <PageHeader
        title="Plano de leitura"
        subtitle="Em reconstrução — voltamos já."
      />
    </AppShell>
  );
}
