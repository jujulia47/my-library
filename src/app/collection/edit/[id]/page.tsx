import AppShell from "@/components/AppShell";
import CollectionFull from "@/components/Update/CollectionFull";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collection")
    .select("*")
    .eq("id", id)
    .single();

  if (!collection) notFound();

  const { count: itemCount } = await supabase
    .from("collection_item")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", id);

  return (
    <AppShell>
      <CollectionFull collection={collection} itemCount={itemCount ?? 0} />
    </AppShell>
  );
}
