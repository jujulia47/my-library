"use client";

import updateSerie from "@/actions/updateSerie";
import { useState } from "react";
import InputField from "../FormFields/InputField";
import SelectField from "../FormFields/SelectField";
import ToggleSwitch from "../FormFields/ToggleSwitch";
import { Database } from "@/utils/typings/supabase";
import clsx from "clsx";
import { useRouter } from "next/navigation";

type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];

interface UpdateSerieProps {
  id: number;
  books: Book[] | null;
  serie: Serie[];
}

export default function UpdateSerie({ id, books, serie }: UpdateSerieProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [initDate, setInitDate] = useState<string>("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [collection_complete, setCollectionComplete] = useState<boolean>(serie[0].collection_complete ?? false);

  const handleFinishDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const finishDate = e.target.value;
    initDate && finishDate < initDate
      ? setDateError(
        "A data de término não pode ser anterior à data de início."
      )
      : setDateError(null);
  };
  
  return serie?.length > 0 ? (
    <section className="min-h-screen bg-[#E1D9C9] py-12 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-4xl mx-auto">
        <form
          action={async (formData) => {
            await updateSerie(formData);
            router.push("/serie");
          }}
          className="p-8 rounded-2xl transition-all duration-300 
            bg-[#E1D9C9]
            shadow-[8px_8px_16px_#c9c2b3,-8px_-8px_16px_#f9f0df]
            hover:shadow-[10px_10px_20px_#c9c2b3,-10px_-10px_20px_#f9f0df]
            border border-[#AE9372]/30"
        >
          <input type="hidden" name="id" value={id} />

          <div className="space-y-6">
            <InputField
              label="Nome da Série"
              name="serie_name"
              id=""
              className="border"
              type="text"
              required
              defaultValue={serie[0].serie_name ?? ""}
            />

            <InputField
              label="Quantidade de volumes:"
              name="qty_volumes"
              id=""
              className="border"
              type="number"
              defaultValue={serie[0].qty_volumes ?? 0}
              required
            />

            <ToggleSwitch
              label="Coleção Completa"
              name="collection_complete"
              id="collection_complete"
              checked={collection_complete}
              value={collection_complete.toString()}
              onChange={(e) => setCollectionComplete(e.target.checked)}
              className="mb-4"
            />
          </div>

          <div>
            <div className="space-y-8">
              <div className="space-y-6">
                <SelectField
                  label="Status da Leitura"
                  name="status"
                  required
                  defaultValue={serie[0].status ?? ""}
                  options={[
                    { value: "tbr", label: "TBR" },
                    { value: "reading", label: "Lendo" },
                    { value: "finish", label: "Finalizado" },
                    { value: "abandoned", label: "Abandonado" },
                  ]}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full"
                />

                <div className="space-y-6">
                  {["reading", "finish", "abandoned"].includes(status) && (
                    <InputField
                      label="Data de Início da Leitura"
                      name="init_date"
                      type="date"
                      required
                      className="w-full"
                      onChange={(e) => {
                        setInitDate(e.target.value);
                      }}
                      defaultValue={serie[0].init_date ?? ""}
                    />
                  )}

                  {status === "reading" && (
                    <fieldset>
                      {books?.length !== 0 && (
                        <SelectField
                          label="Current Book"
                          name="current_book"
                          defaultValue={serie[0].current_book_id ?? ""}
                          options={
                            books?.map((bookName) => {
                              return {
                                value: bookName.id ?? "",
                                label: bookName.title ?? "",
                              };
                            }) || []
                          }
                        />
                      )}
                    </fieldset>
                  )}

                  {status === "finish" && (
                    <div className="space-y-6">
                      <InputField
                        name="finish_date"
                        label="Data finalização da Leitura"
                        type="date"
                        onChange={handleFinishDateChange}
                        className="w-full"
                        defaultValue={serie[0].finish_date ?? ""}
                      />
                      <InputField
                        name="rating"
                        label="Avaliação"
                        type="number"
                        className="w-full"
                        defaultValue={serie[0].rating ?? ""}
                      />
                    </div>
                  )}

                  {status === "abandoned" && (
                    <InputField
                      name="finish_date"
                      label="Data finalização da Leitura"
                      type="date"
                      onChange={handleFinishDateChange}
                      className="w-full"
                      defaultValue={serie[0].finish_date ?? ""}
                    />
                  )}
                </div>
                {dateError && (
                  <p className="text-red-600 text-sm mt-4">{dateError}</p>
                )}
              </div>
            </div>
          </div>

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
        </form>
      </div>
    </section>
  ): (
    <></>
  );
}
