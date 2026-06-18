"use client";

import { useEffect, useState } from "react";
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";
import { isSoundMuted, setSoundMuted } from "@/utils/sounds";

/**
 * Toggle de mute global. Lê/escreve em localStorage via `utils/sounds`.
 * Suspende render do ícone até o `useEffect` rodar pra evitar mismatch
 * de hidratação (server não sabe localStorage, client sabe).
 */
export function SoundToggle() {
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isSoundMuted());
    setMounted(true);
    const handler = () => setMuted(isSoundMuted());
    window.addEventListener("mylib:sound-muted-changed", handler);
    return () => {
      window.removeEventListener("mylib:sound-muted-changed", handler);
    };
  }, []);

  if (!mounted) return null;

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors duration-150 font-body"
      aria-pressed={muted}
      title={muted ? "Som desativado" : "Som ativado"}
    >
      {muted ? (
        <SpeakerXMarkIcon className="w-5 h-5" />
      ) : (
        <SpeakerWaveIcon className="w-5 h-5" />
      )}
      <span>{muted ? "Som off" : "Som on"}</span>
    </button>
  );
}
