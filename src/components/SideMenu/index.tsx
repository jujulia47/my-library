import Link from "next/link";
import { signOut } from "@/app/login/actions";
import SideMenuMobile from "./SideMenuMobile";
import NavItems from "./NavItems";
import { SoundToggle } from "./SoundToggle";
import {
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function SideMenu() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 w-60 h-screen bg-paper border-r border-border flex-col z-40">
        <div className="px-6 py-6 border-b border-border">
          <Link
            href="/"
            className="font-display text-[22px] font-medium tracking-wide text-ink-deep"
          >
            My Library
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          <NavItems />
        </nav>
        <div className="border-t border-border p-3 space-y-1">
          <SoundToggle />
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors duration-150 font-body"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile topbar + drawer */}
      <SideMenuMobile />
    </>
  );
}
