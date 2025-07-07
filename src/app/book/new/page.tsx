import CreateBook from "@/components/Create/Book";
import { serieList } from "@/services/serie"

export default async function CreateBookPage() {
  const series = await serieList();

  return (
    <>
      <main>
        < CreateBook series={series}/>
      </main>
    </>
  );
}
