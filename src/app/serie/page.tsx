import ReadSerie from "@/components/Read/Serie/ReadSerie"
import SideMenu from "@/components/SideMenu"


export default async function SeriePage() {


  return (
    <div>
      <section className="fixed z-40">
        <SideMenu />
      </section>
      <section className="ml-64">
        < ReadSerie />
      </section>
    </div>
  );
}
