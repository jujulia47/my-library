'use client'

import { deleteBook } from "@/actions/deleteBook"

export default function DeleteBookBtn({id}: any) {

  return (
    <button onClick={() => deleteBook(id)}>Delete</button>
  )
}
