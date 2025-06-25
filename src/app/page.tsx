// import Image from "next/image";

// import CreateBook from "@/components/Create/Book";
// import CreateSerie from "@/components/Create/Serie";
import ReadBook from "@/components/Read/ReadBook"
import ReadQuote from "@/components/Read/ReadQuote";
import ReadSerie from "@/components/Read/ReadSerie"
import ReadWishlist from "@/components/Read/ReadWishlist";
import ReadCollection from "@/components/Read/ReadCollection";
// import { serieList } from "@/services/serie"


export default async function Home() {
  // const series = await serieList();

  return (
    <section>
      {/* < CreateBook series={series}/> */}
      {/* < CreateSerie /> */}
      < ReadBook />
      < ReadSerie />
      < ReadWishlist />
      < ReadQuote />
      < ReadCollection />
    </section>
  );
}
