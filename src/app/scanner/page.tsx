import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { ScannerClient } from "@/components/Scanner/ScannerClient";

export const metadata: Metadata = {
  title: "Escanear · My Library",
};

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <ScannerClient />
    </AppShell>
  );
}
