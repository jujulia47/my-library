// import Image from "next/image";

import ReadBook from "@/components/Read/Book/ReadBook"
import ReadQuote from "@/components/Read/Quotes/ReadQuote";
import ReadSerie from "@/components/Read/Serie/ReadSerie"
import ReadWishlist from "@/components/Read/Wishlist/ReadWishlist";
import ReadCollection from "@/components/Read/Collection/ReadCollection";

export default async function Home() {


  return (
    <section>
      < ReadBook />
      < ReadSerie />
      < ReadWishlist />
      < ReadQuote />
      < ReadCollection />
    </section>
  );
}
