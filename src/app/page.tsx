// import Image from "next/image";
import NewBook from "@/components/NewBook";
import { serieList } from "@/services/serie"


export default async function Home() {
  const series = await serieList();

  return (
    <section>
      Hello World!
      < NewBook series={series}/>
    </section>
  );
}
