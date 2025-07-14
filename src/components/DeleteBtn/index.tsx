"use client";

import ConfirmationPopUp from "@/components/ConfirmationPopUp";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteBtn({
  id,
  action,
  message,
}: {
  id: number;
  action: (id: number) => Promise<void>;
  message: string;
}) {
  const [showPopUp, setShowPopUp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    await action(id);
    setShowPopUp(false);
    router.refresh();
    setIsDeleting(false);
  };

  return (
    <>
      <button
        onClick={() => setShowPopUp(true)}
        className="p-1.5 rounded transition hover:bg-[#B85C5A]/10"
        aria-label="Excluir"
        title="Excluir"
        type="button"
      >
        {isDeleting ? (
          <svg
            className="animate-spin h-5 w-5 text-[#B85C5A]"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#B85C5A"
            strokeWidth="1.8"
          >
            <path
              d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {showPopUp && (
        <ConfirmationPopUp
          message={message}
          onConfirm={handleDelete}
          onCancel={() => setShowPopUp(false)}
        />
      )}
    </>
  );
}
