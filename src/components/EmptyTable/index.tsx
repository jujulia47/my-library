import React from "react";
import Link from "next/link";

export default function EmptyTable({message, href, btnText, svg}: {message: string, href: string, btnText: string, svg: React.ReactNode}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24">
      {svg}
      <p className="text-lg text-[#7F4B30] mb-4 font-serif text-center">
        {message}
      </p>
      <Link
        href={href}
        className="px-6 py-2 bg-[#424C21] text-[#F3E2C7] rounded font-bold mt-2 shadow hover:bg-[#7F4B30] transition-colors"
      >
        {btnText}
      </Link>
    </div>
  );
}
