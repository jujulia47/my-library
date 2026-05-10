import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getLibraryData } from "@/services/libraryData";
import { LibraryWall } from "@/components/Library/LibraryWall";

export const metadata: Metadata = {
  title: "Biblioteca · my-library",
};

/**
 * Sessão 17.5: agora wraps em AppShell com `fullBleed` — sidebar e topbar
 * continuam visíveis e clicáveis. Antes (17.4) a página renderizava sem
 * AppShell e a parede escura cobria a sidebar inteira → user ficava preso
 * em /library.
 */
export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getLibraryData(user.id);

  return (
    <AppShell fullBleed>
      <LibraryWall shelves={data.shelves} totalBooks={data.total_books} />
    </AppShell>
  );
}
