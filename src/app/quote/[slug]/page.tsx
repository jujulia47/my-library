import { quoteSlug } from "@/services/quotes";
import DetailsQuotePage from "@/components/DetailsPage/Quote";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const quote = await quoteSlug(slug);

  if (!quote) {
    return <div>Citação não encontrada.</div>;
  }

  return (
    <main>
      <DetailsQuotePage quote={quote}/>
    </main>
  );
}
