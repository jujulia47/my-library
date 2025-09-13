"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { searchBooks } from "@/services/book"
import { Database } from "@/utils/typings/supabase";
import { useDebouncedCallback } from 'use-debounce';

type BookRead = Database["public"]["Tables"]["book"]["Row"];

export default function Search(
  // { searchedBooks }: { searchedBooks: any[] }
) {


  const searchParams = useSearchParams();
  const pathName = usePathname();
  const router = useRouter();

  const [inputValue, setInputValue] = useState("");
  // const [value] = useDebounce(inputValue, 800);
  // console.log(inputValue, "inputValue");
  // console.log(inputValue.length === 0, "inputValue");
  const [suggetions, setSuggetions] = useState<BookRead[]>([]);

  const debounced = useDebouncedCallback(
    // function
    async (inputValue: string) => {
      const searchedBooks = await searchBooks(inputValue, 5);
      setSuggetions(searchedBooks ?? []);
    },
    // delay in ms
    1000
  );

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);

    if (inputValue.trim()) {
      params.set("search", inputValue.trim());
    } else {
      params.delete("search");
    }
    setInputValue("");
    router.push(`${pathName}?${params.toString()}`);
    
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };


  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // const searchedBooks = await searchBooks(inputValue, 5);
    // setSuggetions(searchedBooks ?? []);
    debounced(e.target.value);
    console.log(e.target.value, "e.target.value");
  };

  return (
    <section>
      <input type="text" placeholder="Teste" value={inputValue} onChange={handleChange} onKeyDown={handleKeyDown} />
      <button type="button" onClick={handleSearch}>Buscar</button>

      {
        inputValue.length !== 0 && (
          <ul className="mt-4 space-y-2">
            {suggetions.length > 0 ? (
              suggetions.map((booksResult) => (
                <li key={booksResult.id} className="p-2 border rounded">
                  <Link href={`/book/${booksResult.slug}`}><strong>{booksResult.title}</strong> — {booksResult.author}</Link>
                </li>
              ))
            ) : (
              <li className="text-gray-500">Nenhum resultado encontrado.</li>
            )}
          </ul>
        )
      }
    </section>
  );
}