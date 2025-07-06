"use client";

import createQuote from "@/actions/createQuote";
import { Database } from "@/utils/typings/supabase";
import InputField from "../FormFields/InputField";
import SelectField from "../FormFields/SelectField";
import TextareaField from "../FormFields/TextareaField";
import { useRouter } from "next/navigation";

type Book = Database["public"]["Tables"]["book"]["Row"];

type QuoteProps = {
  books: Book[] | null;
};

export default function CreateQuote({ books }: QuoteProps) {
  const router = useRouter();
  return (
    <section className="min-h-screen bg-[#E1D9C9] py-12 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-4xl mx-auto">
        <form
          action={async (formData) => {
            await createQuote(formData);
            router.push("/quote");
          }}
          className="p-8 rounded-2xl transition-all duration-300 
            bg-[#E1D9C9]
            shadow-[8px_8px_16px_#c9c2b3,-8px_-8px_16px_#f9f0df]
            hover:shadow-[10px_10px_20px_#c9c2b3,-10px_-10px_20px_#f9f0df]
            border border-[#AE9372]/30"
        >
          <div className="space-y-6">
            <TextareaField label="Quote" name="quote" required />

            <fieldset>
              {books?.length !== 0 && (
                <SelectField
                  label="Book"
                  name="book_id"
                  // required
                  options={
                    books?.map((book) => {
                      return {
                        value: book.id ?? "",
                        label: book.title ?? "",
                      };
                    }) || []
                  }
                />
              )}
            </fieldset>

            <InputField label="Page" name="page" type="number" required />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer mt-8
              bg-gradient-to-r from-[#B27D57] to-[#7F4B30]
              shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]
              hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]
              active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]
              transition-all duration-200 transform
              hover:-translate-y-0.5
              focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50"
          >
            Cadastrar
          </button>
        </form>
      </div>
    </section>
  );
}
