"use client";

import Link from "next/link";
import {
  BookOpenIcon,
  Squares2X2Icon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

const SideMenu = () => {
  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-[#7F4B30] shadow-2xl flex flex-col items-center py-8 transition-all duration-300 z-40">
      <h1 className="text-3xl font-extrabold text-[#F3E2C7] mb-10 tracking-wide text-center drop-shadow-lg select-none">
        <Link href="/">Menu</Link>
      </h1>
      <nav className="flex flex-col gap-4 w-full px-6">

        {/* Books */}
        <article className="bg-[#F3E2C7] rounded-lg shadow hover:shadow-xl transition-all duration-200 group">
          <Link
            href="/book"
            className="flex justify-center items-center gap-3 w-full py-3 px-4 text-[#7F4B30] font-bold text-lg rounded-lg hover:bg-[#e8c9a0] focus:outline-none focus:ring-2 focus:ring-[#7F4B30] transition-all duration-200"
          >
            <BookOpenIcon className="w-6 h-6 text-[#7F4B30]" />
            Books
          </Link>
        </article>

        {/* Series */}
        <article className="bg-[#F3E2C7] rounded-lg shadow hover:shadow-xl transition-all duration-200 group">
          <Link
            href="/serie"
            className="flex justify-center items-center gap-3 w-full py-3 px-4 text-[#7F4B30] font-bold text-lg rounded-lg hover:bg-[#e8c9a0] focus:outline-none focus:ring-2 focus:ring-[#7F4B30] transition-all duration-200"
          >
            <Squares2X2Icon className="w-6 h-6 text-[#7F4B30]" />
            Series
          </Link>
        </article>

        {/* Wishlist */}
        <article className="bg-[#F3E2C7] rounded-lg shadow hover:shadow-xl transition-all duration-200 group">
          <Link
            href="/wishlist"
            className="flex justify-center items-center gap-3 w-full py-3 px-4 text-[#7F4B30] font-bold text-lg rounded-lg hover:bg-[#e8c9a0] focus:outline-none focus:ring-2 focus:ring-[#7F4B30] transition-all duration-200"
          >
            <HeartIcon className="w-6 h-6 text-[#7F4B30]" />
            Wishlist
          </Link>
        </article>

        {/* Quotes */}
        <article className="bg-[#F3E2C7] rounded-lg shadow hover:shadow-xl transition-all duration-200 group">
          <Link
            href="/quote"
            className="flex justify-center items-center gap-3 w-full py-3 px-4 text-[#7F4B30] font-bold text-lg rounded-lg hover:bg-[#e8c9a0] focus:outline-none focus:ring-2 focus:ring-[#7F4B30] transition-all duration-200"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#7F4B30]" />
            Quotes
          </Link>
        </article>

        {/* Collection */}
        <article className="bg-[#F3E2C7] rounded-lg shadow hover:shadow-xl transition-all duration-200 group">
          <Link
            href="/collection"
            className="flex justify-center items-center gap-3 w-full py-3 px-4 text-[#7F4B30] font-bold text-lg rounded-lg hover:bg-[#e8c9a0] focus:outline-none focus:ring-2 focus:ring-[#7F4B30] transition-all duration-200"
          >
            <ArchiveBoxIcon className="w-6 h-6 text-[#7F4B30]" />
            Collection
          </Link>
        </article>

      </nav>
    </aside>
  );
};

export default SideMenu;
