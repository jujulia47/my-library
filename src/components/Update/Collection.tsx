"use client";

import updateCollection from "@/actions/updateCollection";
import { Database } from "@/utils/typings/supabase";
import InputField from "../FormFields/InputField";
import MultiSelectWithTags from "../FormFields/MultiSelectWithTags";
import { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import ReturnBtn from "../ReturnBtn";
import SelectField from "../FormFields/SelectField";

type Serie = Database["public"]["Tables"]["serie"]["Row"];
type Collection = Database["public"]["Tables"]["collection"]["Update"];
type Book = Database["public"]["Tables"]["book"]["Row"];
type Wishlist = Database["public"]["Tables"]["wishlist"]["Row"];
type WishlistWithRelations = Wishlist & {
  book: Book;
}

type RelationOption = {
  value: string;
  label: string;
  id: number | null;
  relationId: number;
};

type CollectionRelations = {
  books: RelationOption[];
  series: RelationOption[];
  wishlist: RelationOption[];
};

type UpdateCollectionProps = {
  id: number;
  collection: Collection[];
  series: Serie[] | null;
  books: Book[] | null;
  wishlist: WishlistWithRelations[] | null;
  collectionRelations: CollectionRelations;
};

const UpdateCollection = ({
  id,
  collection,
  collectionRelations,
  series,
  books,
  wishlist,
}: UpdateCollectionProps) => {

  const [selectedBooks, setSelectedBooks] = useState(
    collectionRelations?.books?.map((book) => ({
      value: book.value,
      label: book.label,
    }))
  );

  const [selectedSeries, setSelectedSeries] = useState(
    collectionRelations?.series.map((serie) => ({
      value: serie.value,
      label: serie.label,
    }))
  );

  const [selectedWishlists, setSelectedWishlists] = useState(
    collectionRelations?.wishlist.map((wishBook) => ({
      value: wishBook.value,
      label: wishBook.label,
    }))
  );

  const [initDate, setInitDate] = useState<string>("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [typeCollection, setTypeCollection] = useState<string>("");

  const router = useRouter();

  const handleFinishDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const finishDate = e.target.value;
    initDate && finishDate < initDate
      ? setDateError(
        "A data de término não pode ser anterior à data de início."
      )
      : setDateError(null);
  };

  return collection.length > 0 ? (
    <section className="min-h-screen bg-[#E1D9C9] py-12 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-4xl mx-auto">
        <ReturnBtn href="/collection" btnText="Voltar" />
        <form
          action={async (formData) => {
            await updateCollection(formData);
            router.push("/collection");
          }}
          className="p-8 rounded-2xl transition-all duration-300 
            bg-[#E1D9C9]
            shadow-[8px_8px_16px_#c9c2b3,-8px_-8px_16px_#f9f0df]
            hover:shadow-[10px_10px_20px_#c9c2b3,-10px_-10px_20px_#f9f0df]
            border border-[#AE9372]/30"
        >
          <input type="hidden" name="id_collection" value={id} />

          <div className="space-y-6">
            <InputField
              label="Collection Name"
              type="text"
              name="collection_name"
              required
              defaultValue={collection[0]?.collection_name ?? ""}
              className="w-full"
            />

            <InputField
              label="Description"
              type="text"
              name="description"
              required
              defaultValue={collection[0]?.description ?? ""}
              className="w-full"
            />

            <InputField
              label="Slug"
              type="text"
              name="slug"
              className="w-full mb-4"
              defaultValue={collection[0]?.slug ?? ""}
            />
          </div>

          <MultiSelectWithTags
            label="Livros"
            options={
              books?.map((book) => ({
                value: book.id?.toString() ?? "",
                label: book.title ?? "",
              })) || []
            }
            selected={selectedBooks}
            onSelect={(option) => setSelectedBooks((prev) => [...prev, option])}
            onRemove={(option) =>
              setSelectedBooks((prev) =>
                prev.filter((b) => b.value !== option.value)
              )
            }
            name="book_id"
          />

          <MultiSelectWithTags
            label="Séries"
            options={
              series?.map((serie) => ({
                value: serie.id?.toString() ?? "",
                label: `${serie.serie_name ?? ""}`,
              })) || []
            }
            selected={selectedSeries}
            onSelect={(option) =>
              setSelectedSeries((prev) => [...prev, option])
            }
            onRemove={(option) =>
              setSelectedSeries((prev) =>
                prev.filter((b) => b.value !== option.value)
              )
            }
            name="serie_id"
          />

          <MultiSelectWithTags
            label="Wishlist"
            options={
              wishlist?.map((wishBook) => ({
                value: wishBook.id?.toString() ?? "",
                label: `${wishBook.book?.title ?? ""}`,
              })) || []
            }
            selected={selectedWishlists}
            onSelect={(option) =>
              setSelectedWishlists((prev) => [...prev, option])
            }
            onRemove={(option) =>
              setSelectedWishlists((prev) =>
                prev.filter((b) => b.value !== option.value)
              )
            }
            name="wishlist_id"
          />

          <div className="space-y-6">
            <InputField
              label="Data de Início"
              name="init_date"
              type="date"
              defaultValue={collection[0]?.init_date ?? ""}
              className="w-full"
              onChange={(e) => {
                setInitDate(e.target.value);
              }}
            />

            <InputField
              name="finish_date"
              label="Data finalização"
              type="date"
              defaultValue={collection[0]?.finish_date ?? ""}
              onChange={handleFinishDateChange}
              className="w-full"
            />

            <SelectField
              label="Tipo de coleção"
              name="type_collection"
              options={[
                { value: "wishlist", label: "Wishlist" },
                { value: "challenge", label: "Desafio" },
              ]}
              defaultValue={collection[0]?.type_collection ?? ""}
              onChange={(e) => {
                setTypeCollection(e.target.value);
              }}
              className="w-full"
            />
            {typeCollection === "challenge" && (
              <SelectField
                label="Status"
                name="status"
                options={[
                  { value: "ongoing", label: "Em andamento" },
                  { value: "concluded", label: "Concluído" },
                  { value: "not-concluded", label: "Não concluído" },
                ]}
                defaultValue={collection[0]?.status ?? ""}
                className="w-full"
              />
            )}
          </div>
          {dateError && (
            <p className="text-red-600 text-sm mt-4">{dateError}</p>
          )}

          <div className="mt-8">
            <button
              type="submit"
              disabled={!!dateError}
              className={clsx(
                "w-full px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer mt-8",
                "bg-gradient-to-r from-[#B27D57] to-[#7F4B30]",
                "shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]",
                "hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]",
                "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]",
                "transition-all duration-200 transform",
                "hover:-translate-y-0.5",
                "focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50",
                dateError
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:-translate-y-0.5"
              )}
            >
              Atualizar
            </button>
          </div>
        </form>
      </div>
    </section>
  ) : (
    <></>
  );
};

export default UpdateCollection;
