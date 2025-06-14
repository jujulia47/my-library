// import Image from "next/image";
import CreateBook from "@/components/Create/Book";
import CreateSerie from "@/components/Create/Serie";
import { serieList } from "@/services/serie"


export default async function Home() {
  const series = await serieList();

  return (
    <section>
      Hello World!
      {/* < CreateBook series={series}/> */}
      < CreateSerie />
    </section>
  );
}
