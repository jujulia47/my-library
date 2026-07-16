import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { createClient } from "@/utils/supabase/server";
import { subscriptionsWithStats } from "@/services/subscriptionList";
import SubscriptionsClient from "@/components/Subscriptions/SubscriptionsClient";

export const metadata: Metadata = {
  title: "Assinaturas · My Library",
};

export const dynamic = "force-dynamic";

export default async function AssinaturasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const subscriptions = await subscriptionsWithStats();

  return (
    <AppShell>
      <PageHeader
        title="Assinaturas"
        subtitle="Gerencie suas assinaturas de livros (TAG, Kindle Unlimited…) e o valor mensal"
      />
      <SubscriptionsClient subscriptions={subscriptions} />
    </AppShell>
  );
}
