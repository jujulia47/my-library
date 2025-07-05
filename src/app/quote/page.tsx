import ReadQuote from "@/components/Read/Quotes/ReadQuote"
import SideMenu from "@/components/SideMenu"


export default async function QuotePage() {


  return (
    <div>
      <section className="fixed z-40">
        <SideMenu />
      </section>
      <section className="ml-64">
        < ReadQuote />
      </section>
    </div>
  );
}
