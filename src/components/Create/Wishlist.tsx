"use client";

import createWishlist from "@/actions/createWishlist";
import { Database } from "@/utils/typings/supabase";
import { useState } from "react";
import InputField from "../FormFields/InputField";
import SelectField from "../FormFields/SelectField";
import ToggleSwitch from "../FormFields/ToggleSwitch";

type Serie = Database["public"]["Tables"]["serie"]["Row"];

type SerieProps = {
  series: Serie[] | null;
};

const CreateWishlist = ({ series }: SerieProps) => {
  const [singleBook, setSingleBook] = useState<boolean>(false);

  return (
    <section className="min-h-screen bg-[#E1D9C9] py-12 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-4xl mx-auto">
        <form
          action={createWishlist}
          className="p-8 rounded-2xl transition-all duration-300 
            bg-[#E1D9C9]
            shadow-[8px_8px_16px_#c9c2b3,-8px_-8px_16px_#f9f0df]
            hover:shadow-[10px_10px_20px_#c9c2b3,-10px_-10px_20px_#f9f0df]
            border border-[#AE9372]/30"
        >
          <div className="space-y-6">
            <InputField
              label="Book Title"
              type="text"
              name="book_name"
              required
              className="w-full"
            />

            <InputField
              label="Autor(a)"
              type="text"
              name="author"
              required
              className="w-full"
            />

            <ToggleSwitch
              label="Livro Único?"
              name="single_book"
              id="single_book"
              checked={singleBook}
              value={singleBook.toString()}
              onChange={(e) => setSingleBook(e.target.checked)}
              className="mb-4"
            />

            <fieldset disabled={singleBook} className="space-y-4">
              {series?.length !== 0 && (
                <SelectField
                  label="Serie"
                  name="serie_id"
                  options={
                    series?.map((serieName) => {
                      return {
                        value: serieName.id ?? "",
                        label: serieName.serie_name ?? "",
                      };
                    }) || []
                  }
                />
              )}
              <InputField
                label="Adicionar nova Série"
                type="text"
                name="serie_name"
                className="w-full"
              />
            </fieldset>

            <InputField
              label="Volume"
              type="number"
              name="volume"
              className="w-full"
            />

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
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateWishlist;
