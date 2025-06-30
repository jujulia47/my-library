'use client'

import { deleteBook } from "@/actions/deleteBook"

export default function DeleteBookBtn({id}: {id: number}) {

  return (
    <>
      <button
        onClick={() => deleteBook(id)}
        className="p-1.5 rounded transition hover:bg-[#B85C5A]/10"
        aria-label="Excluir"
        title="Excluir"
        type="button"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#B85C5A" strokeWidth="1.8">
          <path d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" />
        </svg>
      </button>
    </>
  )
}
