import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getLibraryData, getShelfById } from "@/services/libraryData";
import { ShelfZoom } from "@/components/Library/ShelfZoom";

export const metadata: Metadata = {
  title: "Estante · my-library",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShelfZoomPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [shelf, allData] = await Promise.all([
    getShelfById(id, user.id),
    getLibraryData(user.id),
  ]);

  if (!shelf) notFound();

  return (
    <main className="min-h-screen bg-library-dark px-6 py-8">
      <div className="max-w-[1400px] mx-auto">
        <ShelfZoom shelf={shelf} allShelves={allData.shelves} />
      </div>
    </main>
  );
}
