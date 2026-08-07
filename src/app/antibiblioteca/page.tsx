import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getAntibiblioteca } from "@/services/antibibliotecaData";
import { AntibibliotecaClient } from "@/components/Antibiblioteca/AntibibliotecaClient";

export const metadata: Metadata = {
  title: "Antibiblioteca · My Library",
};

export const dynamic = "force-dynamic";

export default async function AntibibliotecaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getAntibiblioteca(user.id);

  return (
    <AppShell>
      <AntibibliotecaClient data={data} />
    </AppShell>
  );
}
