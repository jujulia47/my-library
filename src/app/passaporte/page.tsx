import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getPassport } from "@/services/passportData";
import { PassaporteClient } from "@/components/Passport/PassaporteClient";

export const metadata: Metadata = {
  title: "Passaporte literário · My Library",
};

export const dynamic = "force-dynamic";

export default async function PassaportePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getPassport(user.id);

  return (
    <AppShell>
      <PassaporteClient data={data} />
    </AppShell>
  );
}
