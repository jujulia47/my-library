import AppShell from "@/components/AppShell";
import CollectionDetailClient from "@/components/DetailsPage/CollectionDetailClient";
import { getCollectionDetailBySlug } from "@/services/collectionDetail";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCollectionDetailBySlug(slug);
  if (!data) notFound();

  return (
    <AppShell>
      <CollectionDetailClient data={data} />
    </AppShell>
  );
}
