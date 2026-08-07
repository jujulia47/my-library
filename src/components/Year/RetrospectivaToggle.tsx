"use client";

import { useState } from "react";
import { RetrospectivaStory } from "./RetrospectivaStory";
import type { RetrospectiveData } from "@/services/retrospectiveData";

export function RetrospectivaToggle({ data }: { data: RetrospectiveData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#2a1e08] bg-gradient-to-b from-[#e6cf8f] to-[#c6a250] shadow-[0_12px_28px_-12px_rgba(180,134,58,0.7)] transition-transform hover:-translate-y-0.5"
      >
        <span aria-hidden>▶</span>
        Ver {data.year} em modo história
      </button>
      {open && (
        <RetrospectivaStory data={data} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
