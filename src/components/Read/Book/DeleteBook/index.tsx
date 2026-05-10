'use client'

import { deleteBook } from "@/actions/deleteBook"
import ConfirmationPopUp from "@/components/ConfirmationPopUp"
import { useState } from "react";
import { useRouter } from "next/navigation"

export default function DeleteBookBtn({ id }: { id: string }) {
  const [showPopUp, setShowPopUp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false)

  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteBook(id)
    setIsDeleting(false)
    if (!result.ok) {
      // eslint-disable-next-line no-alert
      window.alert(result.message)
      return
    }
    setShowPopUp(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setShowPopUp(true)}
        className="p-1.5 rounded text-burgundy hover:bg-burgundy/10 transition-colors"
        aria-label="Excluir"
        title="Excluir"
        type="button"
      >
        {isDeleting ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {showPopUp && (
        <ConfirmationPopUp
          message="Certeza que deseja excluir este livro?"
          onConfirm={handleDelete}
          onCancel={() => setShowPopUp(false)}
        />
      )}

    </>
  )
}
