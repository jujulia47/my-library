import ReadBook from "@/components/Read/Book/ReadBook"
import SideMenu from "@/components/SideMenu"


export default async function BookPage() {


  return (
    <div>
      <section className="fixed z-40">
        <SideMenu />
      </section>
      <section className="ml-64">
        < ReadBook />
      </section>
    </div>
  );
}
