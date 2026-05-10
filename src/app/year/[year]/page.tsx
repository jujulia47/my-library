import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getYearData } from "@/services/yearData";
import { SectionLabel } from "@/components/Home/SectionLabel";
import { YearHeader } from "@/components/Year/YearHeader";
import { YearRecords } from "@/components/Year/YearRecords";
import { TopBooksOfYear } from "@/components/Year/TopBooksOfYear";
import { YearAchievements } from "@/components/Year/YearAchievements";
import { YearAcquisitions } from "@/components/Year/YearAcquisitions";
import { YearCountries } from "@/components/Year/YearCountries";
import { FavoriteQuoteOfYear } from "@/components/Year/FavoriteQuoteOfYear";
import { YearTimeline } from "@/components/Year/YearTimeline";
import { YearFooterStats } from "@/components/Year/YearFooterStats";
import { YearEmptyState } from "@/components/Year/YearEmptyState";

type Props = {
  params: Promise<{ year: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params;
  return { title: `Resumo de ${year} · my-library` };
}

export default async function YearPage({ params }: Props) {
  const { year: yearStr } = await params;
  const year = Number.parseInt(yearStr, 10);

  if (Number.isNaN(year) || year < 1900 || year > 2100) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getYearData(year, user.id);

  if (
    data.total_books_finished === 0 &&
    data.acquisitions.total_count === 0
  ) {
    return (
      <AppShell>
        <YearEmptyState year={year} availableYears={data.available_years} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <YearHeader
        year={year}
        availableYears={data.available_years}
        totalBooks={data.total_books_finished}
        totalPages={data.total_pages_read}
      />

      <SectionLabel>Recordes do ano</SectionLabel>
      <YearRecords records={data.records} />

      {data.top_books.length > 0 && (
        <>
          <SectionLabel>Top livros do ano</SectionLabel>
          <TopBooksOfYear books={data.top_books} />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
        <YearAchievements achievements={data.achievements} year={year} />
        <YearAcquisitions acquisitions={data.acquisitions} year={year} />
      </div>

      {data.countries.length > 0 && (
        <>
          <SectionLabel>Países dos autores</SectionLabel>
          <YearCountries countries={data.countries} />
        </>
      )}

      {data.favorite_quote && (
        <>
          <SectionLabel>Citação do ano</SectionLabel>
          <FavoriteQuoteOfYear quote={data.favorite_quote} />
        </>
      )}

      <SectionLabel>Linha do tempo</SectionLabel>
      <YearTimeline timeline={data.monthly_timeline} year={year} />

      <YearFooterStats stats={data.footer_stats} />
    </AppShell>
  );
}
