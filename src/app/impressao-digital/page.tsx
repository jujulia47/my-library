import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getFingerprint } from "@/services/fingerprintData";
import { ImpressaoClient } from "@/components/Fingerprint/ImpressaoClient";

export const metadata: Metadata = {
  title: "Impressão digital · My Library",
};

export const dynamic = "force-dynamic";

export default async function ImpressaoDigitalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getFingerprint(user.id);

  return (
    <AppShell>
      <ImpressaoClient data={data} />
    </AppShell>
  );
}
