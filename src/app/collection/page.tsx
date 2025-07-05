import ReadCollection from "@/components/Read/Collection/ReadCollection"
import SideMenu from "@/components/SideMenu"


export default async function CollectionPage() {


  return (
    <div>
      <section className="fixed z-40">
        <SideMenu />
      </section>
      <section className="ml-64">
        < ReadCollection />
      </section>
    </div>
  );
}
