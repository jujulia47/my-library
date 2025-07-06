"use client";
import updateBook from "@/actions/updateBook";
import { Database } from "@/utils/typings/supabase";
import { useState } from "react";
import InputField from "../FormFields/InputField";
import SelectField from "../FormFields/SelectField";
import TextareaField from "../FormFields/TextareaField";
import ToggleSwitch from "../FormFields/ToggleSwitch";
import clsx from "clsx";
import Link from "next/link";
import CheckboxField from "../FormFields/CheckboxField";
import { useRouter } from "next/navigation";

type Book = Database["public"]["Tables"]["book"]["Update"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];

interface UpdateBookProps {
  id: number;
  book: Book[];
  series: Serie[] | null;
}

const UpdateBook = ({ id, book, series }: UpdateBookProps) => {
  const [singleBook, setSingleBook] = useState<boolean>(false);
  const [library, setLibrary] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [initDate, setInitDate] = useState<string>("")
  const [dateError, setDateError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { title: "Informações Básicas", number: 1 },
    { title: "Biblioteca", number: 2 },
    { title: "Progresso da Leitura", number: 3 },
    { title: "Comentários", number: 4 },
  ];

  const router = useRouter();

  const goToStep = (step: number) => {
    if (step >= 1 && step <= steps.length) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  const handleFinishDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const finishDate = e.target.value;
    (initDate && finishDate < initDate) ? setDateError("A data de término não pode ser anterior à data de início.") : setDateError(null);
  };

  return book.length > 0 ? (
    <section className="min-h-screen bg-[#E1D9C9] py-12 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-4xl mx-auto">
        <form
          action={async (formData) => {
            await updateBook(formData);
            router.push("/book");
          }}
          className="p-8 rounded-2xl transition-all duration-300 
            bg-[#E1D9C9]
            shadow-[8px_8px_16px_#c9c2b3,-8px_-8px_16px_#f9f0df]
            hover:shadow-[10px_10px_20px_#c9c2b3,-10px_-10px_20px_#f9f0df]
            border border-[#AE9372]/30"
        >
          {/* Form Content Wrapper */}
          <div className="bg-[#F5F1E9] p-8 rounded-xl shadow-inner border border-[#E1D9C9] mb-8">
            {/* Step Indicators with Progress Bar */}
            <div className="mb-12 flex items-center justify-between relative">
              {/* Background Track */}
              <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0">
                <div className="w-full h-full flex items-center px-12">
                  <div className="flex-1 h-full bg-[#E1D9C9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#B27D57] to-[#7F4B30] transition-all duration-500 ease-out"
                      style={{
                        width: `${(currentStep - 1) * (100 / (steps.length - 1))
                          }%`,
                        height: "100%",
                        maxWidth: "100%",
                        borderRadius: "4px",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              {steps.map((step, index) => {
                const isActive = currentStep === index + 1;
                const isCompleted = currentStep > index + 1;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToStep(step.number)}
                    className="relative z-10 flex flex-col items-center focus:outline-none group"
                  >
                    <div
                      className={clsx(
                        "flex items-center justify-center w-12 h-12 rounded-full text-sm font-medium transition-all duration-300",
                        isActive &&
                        "bg-gradient-to-br from-[#B27D57] to-[#8E5D3D] text-[#E1D9C9] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] border border-[#AE9372]/30 scale-110",
                        isCompleted &&
                        !isActive &&
                        "bg-[#E1D9C9] text-[#7F4B30] border border-[#AE9372]/30 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]",
                        !isActive &&
                        !isCompleted &&
                        "bg-[#E1D9C9] text-[#7F4B30] border border-[#AE9372]/30 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]"
                      )}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-base">{step.number}</span>
                      )}
                    </div>
                    <span
                      className={clsx(
                        "mt-2 text-xs font-medium transition-colors",
                        isActive && "text-[#7F4B30] font-semibold",
                        isCompleted &&
                        "text-[#424C21] group-hover:text-[#173125]",
                        !isActive &&
                        !isCompleted &&
                        "text-[#7F4B30] group-hover:text-[#7F4B30]"
                      )}
                    >
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-8">
              <input type="hidden" name="id" value={id} />

              <div className={clsx(currentStep === 1 ? "block" : "hidden")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <InputField
                        label="Book Title"
                        type="text"
                        name="title"
                        required
                        defaultValue={book[0]?.title}
                        className="w-full"
                      />

                      <InputField
                        label="Autor(a)"
                        type="text"
                        name="author"
                        required
                        defaultValue={book[0]?.author}
                        className="w-full"
                      />

                      <InputField
                        label="Capa"
                        type="text"
                        name="cover"
                        required
                        defaultValue={book[0]?.cover}
                        className="w-full"
                      />

                      <InputField
                        label="Quantidade de Páginas"
                        type="number"
                        name="pages"
                        defaultValue={book[0]?.pages ?? ""}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 bg-[#F5F1E9]/50 p-8 rounded-xl shadow-inner border border-[#E1D9C9]">
                    <div className="space-y-4">
                      <InputField
                        label="Categoria"
                        type="text"
                        name="category"
                        defaultValue={book[0]?.category ?? ""}
                        className="w-full"
                      />

                      <SelectField
                        label="Idioma"
                        name="language"
                        required
                        defaultValue={book[0]?.language ?? ""}
                        options={[
                          { value: "pt", label: "Português" },
                          { value: "en", label: "English" },
                          { value: "es", label: "Espanhol" },
                        ]}
                        className="w-full"
                      />

                      <div className="space-y-2">
                        <ToggleSwitch
                          label="Livro Único?"
                          name="single_book"
                          id="single_book"
                          checked={singleBook}
                          value={singleBook.toString()}
                          onChange={(e) => setSingleBook(e.target.checked)}
                          className="mb-4"
                        />
                      </div>

                      <fieldset>
                        {series?.length !== 0 && (
                          <SelectField
                            label="Serie"
                            name="serie_id"
                            disabled={singleBook}
                            // required={!singleBook}
                            defaultValue={book[0]?.serie_id ?? ""}
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
                      </fieldset>

                      <InputField
                        label="Volume"
                        type="number"
                        name="volume"
                        defaultValue={book[0]?.volume ?? ""}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={clsx(currentStep === 2 ? "block" : "hidden")}>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <ToggleSwitch
                      label="Na biblioteca?"
                      name="library"
                      id="library"
                      checked={library}
                      value={library.toString()}
                      onChange={(e) => setLibrary(e.target.checked)}
                      className="mb-4"
                    />
                  </div>


                  {library && (
                    <InputField
                      label="Data que entrou pra coleção"
                      type="date"
                      name="acquisition_date"
                      defaultValue={book[0]?.acquisition_date ?? ""}
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              <div className={clsx(currentStep === 3 ? "block" : "hidden")}>
                <div className="space-y-8">
                  <div className="space-y-6">
                    <SelectField
                      label="Status da Leitura"
                      name="status"
                      required
                      defaultValue={book[0]?.status ?? ""}
                      options={[
                        { value: "tbr", label: "TBR" },
                        { value: "reading", label: "Lendo" },
                        { value: "finish", label: "Finalizado" },
                        { value: "abandoned", label: "Abandonado" },
                      ]}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full"
                    />

                    <div className="space-y-4">
                      {["reading", "finish", "abandoned"].includes(status) && (
                        <InputField
                          label="Data de Início da Leitura"
                          name="init_date"
                          type="date"
                          defaultValue={book[0]?.init_date ?? ""}
                          className="w-full"
                          onChange={(e) => { setInitDate(e.target.value) }}
                        />
                      )}

                      {status === "reading" && (
                        <InputField
                          label="Página atual"
                          name="current_page"
                          type="number"
                          defaultValue={book[0]?.current_page ?? ""}
                          className="w-full"
                        />
                      )}

                      {status === "finish" && (
                        <div className="space-y-4">
                          <InputField
                            name="finish_date"
                            label="Data finalização da Leitura"
                            type="date"
                            defaultValue={book[0]?.finish_date ?? ""}
                            onChange={handleFinishDateChange}
                            className="w-full"
                          />
                          <InputField
                            name="rating"
                            label="Avaliação"
                            type="number"
                            defaultValue={book[0]?.rating ?? ""}
                            className="w-full"
                          />
                        </div>
                      )}

                      {status === "abandoned" && (
                        <InputField
                          name="finish_date"
                          label="Data finalização da Leitura"
                          type="date"
                          defaultValue={book[0]?.finish_date ?? ""}
                          onChange={handleFinishDateChange}
                          className="w-full"
                        />
                      )}
                    </div>
                    {dateError && (
                      <p className="text-red-600 text-sm mt-1">{dateError}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={clsx(currentStep === 4 ? "block" : "hidden")}>
                <div className="space-y-6 bg-[#F5F1E9] p-6 rounded-lg border border-[#AE9372]/50">
                  <TextareaField
                    label="Comentários"
                    name="comments"
                    defaultValue={book[0]?.comments ?? ""}
                    className="w-full bg-white/80 border-[#AE9372] focus:border-[#7F4B30] focus:ring-2 focus:ring-[#AE9372]/30 transition-all duration-200 text-[#173125] placeholder-[#AE9372]"
                    style={{ fontFamily: "inherit" }}
                  />

                  <fieldset className="flex flex-col gap-2 mt-6">
                    <legend className="mb-2 font-semibold text-[#5A3522] text-base">Versão do Livro</legend>
                    <div className="flex flex-row gap-8">
                      <CheckboxField
                        label="Físico"
                        key="physical"
                        type="checkbox"
                        name="physical"
                        id="physical"
                        value={"physical"}
                        defaultChecked={book[0]?.version?.includes("physical")}
                        className="min-w-[120px]"
                      />
                      <CheckboxField
                        key="audiobook"
                        label="Audiobook"
                        type="checkbox"
                        name="audiobook"
                        id="audiobook"
                        value={"audiobook"}
                        defaultChecked={book[0]?.version?.includes("audiobook")}
                        className="min-w-[120px]"
                      />
                      <CheckboxField
                        key="ebook"
                        label="E-book"
                        type="checkbox"
                        name="ebook"
                        id="ebook"
                        value={"ebook"}
                        defaultChecked={book[0]?.version?.includes("ebook")}
                        className="min-w-[120px]"
                      />
                    </div>
                  </fieldset>

                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={!!dateError}
                      className={clsx(
                        "w-full px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer",
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
                </div>
              </div>

              <div className="mt-12 flex justify-between items-center">
                {currentStep > 1 && (
                  <Link
                    href="#"
                    onClick={prevStep}
                    className="px-6 py-2.5 text-sm font-medium text-[#7F4B30] 
                    bg-[#E1D9C9] border border-[#AE9372]/30 rounded-xl
                    shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)]
                    hover:shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.8)]
                    active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]
                    transition-all duration-200 transform
                    hover:-translate-y-0.5
                    focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50
                    flex items-center"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Voltar
                  </Link>
                )}
                <div className="flex-1"></div>
                {currentStep < steps.length && (
                  <Link
                    href="#"
                    onClick={nextStep}
                    className="px-6 py-2.5 text-sm font-medium text-[#E1D9C9]
                    bg-gradient-to-r from-[#B27D57] to-[#7F4B30]
                    shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]
                    hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]
                    active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]
                    transition-all duration-200 transform
                    hover:-translate-y-0.5
                    focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50
                    rounded-xl flex items-center"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    Próximo
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  ) : (
    <div>Nada aqui</div>
  );
};

export default UpdateBook;
