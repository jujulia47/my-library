"use client";

import createBook from "@/actions/createBook";
import { Database } from "@/utils/typings/supabase";
import { useState, useEffect, useRef } from "react";
import InputField from "../FormFields/InputField";
import SelectField from "../FormFields/SelectField";
import TextareaField from "../FormFields/TextareaField";
import ToggleSwitch from "../FormFields/ToggleSwitch";
import CheckboxField from "../FormFields/CheckboxField";
import StarRating from "../FormFields/StarRating";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import ReturnBtn from "@/components/ReturnBtn";
import Image from "next/image";
import { authorAutoComplete, categoryAutoComplete } from "@/services/book";

type Serie = Database["public"]["Tables"]["serie"]["Row"];

type SerieProps = {
  series: Serie[] | null;
};

//passando props para esse componente ser client side e o SerieList que é server side fica onde recebe esse componente
//Precisa ser client side para conseguir validar os input conforme o usuário for clicando
const CreateBook = ({ series }: SerieProps) => {
  const router = useRouter();

  const [singleBook, setSingleBook] = useState<boolean>(false);
  const [library, setLibrary] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [rereadStatus, setRereadStatus] = useState<string>("");
  const [initDate, setInitDate] = useState<string>("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [openInput, setOpenInput] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [rereading, setRereading] = useState<boolean>(false);

  const [authorValue, setAuthorValue] = useState<string>("");
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [authorSuggestions, setAuthorSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthorValue(e.target.value);
    const authorResult = await authorAutoComplete(authorValue);
    setAuthorSuggestions(authorResult);
  };

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryValue(e.target.value);
    const categoryResult = await categoryAutoComplete(categoryValue);
    setCategorySuggestions(categoryResult);
  };

  const handleSelectAuthor = (author: string) => {
    setAuthorValue(author);
    setShowAuthorSuggestions(false);
    // setAuthorSuggestions([]);
  };

  const handleSelectCategory = (category: string, e: React.MouseEvent) => {
    setCategoryValue(category);
    setShowCategorySuggestions(false);
    // setCategorySuggestions([]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          setCoverUrl(result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          setCoverUrl(result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const steps = [
    { title: "Informações Básicas", number: 1 },
    { title: "Biblioteca", number: 2 },
    { title: "Progresso da Leitura", number: 3 },
    { title: "Comentários", number: 4 },
  ];

  const goToStep = (step: number) => {
    if (step >= 1 && step <= steps.length) {
      setCurrentStep(step);
    }
  };
  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  const handleFinishDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const finishDate = e.target.value;
    initDate && finishDate < initDate
      ? setDateError(
        "A data de término não pode ser anterior à data de início."
      )
      : setDateError(null);
  };

  return (
    <section className="min-h-screen bg-[#E1D9C9] py-12 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-4xl mx-auto">
        <ReturnBtn href="/book" btnText="Voltar" />
        <form
          action={async (formData) => {
            await createBook(formData);
            router.push("/book");
          }}
          className="p-8 rounded-2xl transition-all duration-300 
            bg-[#E1D9C9]
            shadow-[8px_8px_16px_#c9c2b3,-8px_-8px_16px_#f9f0df]
            hover:shadow-[10px_10px_20px_#c9c2b3,-10px_-10px_20px_#f9f0df]
            border border-[#AE9372]/30"
        >
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
                      className={[
                        "flex items-center justify-center w-12 h-12 rounded-full text-sm font-medium transition-all duration-300",
                        isActive &&
                        "bg-gradient-to-br from-[#B27D57] to-[#8E5D3D] text-[#E1D9C9] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] border border-[#AE9372]/30 scale-110",
                        isCompleted &&
                        !isActive &&
                        "bg-[#E1D9C9] text-[#7F4B30] border border-[#AE9372]/30 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]",
                        !isActive &&
                        !isCompleted &&
                        "bg-[#E1D9C9] text-[#7F4B30] border border-[#AE9372]/30 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
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
                      className={[
                        "mt-2 text-xs font-medium transition-colors",
                        isActive && "text-[#7F4B30] font-semibold",
                        isCompleted &&
                        "text-[#424C21] group-hover:text-[#173125]",
                        !isActive &&
                        !isCompleted &&
                        "text-[#7F4B30] group-hover:text-[#7F4B30]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Steps Content */}
            <div className="space-y-8">
              {/* Step 1: Informações Básicas */}
              <div className={clsx(currentStep === 1 ? "block" : "hidden")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="cover-upload"
                            className={`flex flex-col items-center justify-center w-64 h-96 border-2 border-dashed rounded-lg cursor-pointer transition-colors mx-auto
                              ${isDragging
                                ? "border-[#7F4B30] bg-white/70"
                                : "border-[#E1D9C9] bg-white/50 hover:bg-white/70"
                              }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            {coverUrl ? (
                              <div className="relative w-full h-full rounded-lg overflow-hidden">
                                <Image
                                  src={coverUrl}
                                  alt="Pré-visualização da capa"
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="bg-white/90 text-[#7F4B30] px-4 py-2 rounded-md text-sm font-medium">
                                    {isDragging
                                      ? "Solte para alterar"
                                      : "Alterar imagem"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-6 text-center">
                                {isDragging ? (
                                  <>
                                    <div className="w-16 h-16 mb-4 border-4 border-dashed border-[#7F4B30] rounded-full flex items-center justify-center">
                                      <svg
                                        className="w-8 h-8 text-[#7F4B30] animate-bounce"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                        />
                                      </svg>
                                    </div>
                                    <p className="text-lg font-semibold text-[#7F4B30] mb-1">
                                      Solte a imagem aqui
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-10 h-10 mb-2 text-[#7F4B30]"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <p className="text-sm text-[#7F4B30]">
                                      <span className="font-semibold">
                                        Clique para enviar
                                      </span>{" "}
                                      ou arraste uma imagem
                                    </p>
                                  </>
                                )}
                                <p className="text-xs text-[#7F4B30]/70 mt-1">
                                  PNG, JPG (Máx. 5MB)
                                </p>
                              </div>
                            )}
                            <input
                              id="cover-upload"
                              type="file"
                              name="cover"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        {coverUrl && (
                          <button
                            type="button"
                            onClick={() => setCoverUrl("")}
                            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                          >
                            Remover imagem
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="mt-4">
                          <InputField
                            label="Título do Livro"
                            type="text"
                            name="title"
                            required
                            className="w-full"
                            placeholder="book title"
                          />
                        </div>

                        <div className="mt-4 relative w-full">
                          <InputField
                            label="Autor(a)"
                            type="text"
                            name="author"
                            required
                            className="w-full"
                            onChange={handleChange}
                            placeholder="author"
                            value={authorValue || ""}
                            onFocus={() => setShowAuthorSuggestions(true)}
                            onBlur={() => setShowAuthorSuggestions(false)}
                          />

                          {showAuthorSuggestions && authorSuggestions.length > 0 && (
                            <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto z-10 rounded-lg bg-[#F5F1E9] border border-[#AE9372]/50 shadow-[4px_4px_8px_rgba(0,0,0,0.1)] w-full">
                              {authorSuggestions.map((s, i) => (
                                <li
                                  key={i}
                                  //onMouseDown dispara antes do blur, então o item é selecionado com segurança.
                                  //Evite usar onClick nos <li> se você mantém onBlur no input — o click pode não acontecer.
                                  onMouseDown={() => handleSelectAuthor(s)}
                                  className="px-4 py-2 text-[#5A3522] hover:bg-[#E8D9C5] cursor-pointer transition-colors duration-200"
                                >
                                  {s}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <InputField
                          label="Slug"
                          type="text"
                          name="slug"
                          className="w-full"
                          placeholder="book url"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 bg-[#F5F1E9]/50 p-8 rounded-xl shadow-inner border border-[#E1D9C9]">
                    <div className="space-y-4">
                      <InputField
                        label="Quantidade de Páginas"
                        type="number"
                        name="pages"
                        className="w-full"
                        placeholder="pages"
                      />
                      <div className="relative w-full" 
                      // ref={categoryRef}
                      >
                        <InputField
                          label="Categoria"
                          type="text"
                          name="category"
                          className="w-full"
                          placeholder="category"
                          onChange={handleCategoryChange}
                          value={categoryValue || ""}
                          onFocus={() => setShowCategorySuggestions(true)}
                          onBlur={() => setShowCategorySuggestions(false)}
                        />
                        
                        {showCategorySuggestions && categorySuggestions.length > 0 && (
                          <ul className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-auto z-10 rounded-lg bg-[#F5F1E9] border border-[#AE9372]/50 shadow-[4px_4px_8px_rgba(0,0,0,0.1)]">
                              {categorySuggestions.map((s, i) => (
                                <li
                                  key={i}
                                  onMouseDown={(e) => handleSelectCategory(s, e)}
                                  className="px-4 py-2 text-[#5A3522] hover:bg-[#E8D9C5] cursor-pointer transition-colors duration-200"
                                >
                                  {s}
                                </li>
                              ))}
                            </ul>
                          )}
                      </div>
                      <SelectField
                        label="Idioma"
                        name="language"
                        required
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

                      {singleBook === false && (
                        <>
                          <div className="mt-4" />
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              {openInput ? (
                                <InputField
                                  label="Adicionar nova Série"
                                  type="text"
                                  name="serie_name"
                                  className="w-full"
                                  disabled={singleBook}
                                />
                              ) : (
                                <fieldset className="w-full">
                                  {series?.length !== 0 && (
                                    <SelectField
                                      label="Série"
                                      name="serie_id"
                                      disabled={singleBook}
                                      options={
                                        series?.map((serieName) => ({
                                          value: serieName.id ?? "",
                                          label: serieName.serie_name ?? "",
                                        })) || []
                                      }
                                    />
                                  )}
                                </fieldset>
                              )}
                            </div>
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={() => setOpenInput(!openInput)}
                                className={clsx(
                                  "flex items-center justify-center w-8 h-8 rounded-full mt-6",
                                  "text-[#7F4B30] font-medium text-lg bg-[#E1D9C9]",
                                  "border border-[#AE9372]/30 cursor-pointer",
                                  "shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)]",
                                  "hover:shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]",
                                  "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]",
                                  "transition-all duration-200 transform hover:scale-105",
                                  "focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50",
                                  "shrink-0"
                                )}
                                aria-label={
                                  openInput
                                    ? "Fechar formulário de nova série"
                                    : "Adicionar nova série"
                                }
                              >
                                {openInput ? "×" : "+"}
                              </button>
                              <span
                                className={clsx(
                                  "absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1",
                                  "text-xs text-white bg-[#5A3522] rounded",
                                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                                  "whitespace-nowrap pointer-events-none",
                                  "shadow-lg z-10",
                                  "transform -translate-y-1 group-hover:translate-y-0 transition-transform duration-200"
                                )}
                              >
                                {openInput
                                  ? "Fechar"
                                  : "Adicionar uma nova série"}
                              </span>
                            </div>
                          </div>

                          <InputField
                            label="Volume"
                            type="number"
                            name="volume"
                            className="w-full"
                            disabled={singleBook}
                            placeholder="volume"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-8">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer
                        bg-gradient-to-r from-[#B27D57] to-[#7F4B30]
                        shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]
                        hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]
                        active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]
                        transition-all duration-200 transform
                        hover:-translate-y-0.5
                        focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
              {/* )} */}
              {/* Step 2: Biblioteca */}
              {/* {currentStep === 2 && ( */}
              <div className={clsx(currentStep === 2 ? "block" : "hidden")}>
                <div className="flex justify-between">
                  <div
                    className={clsx(
                      "space-y-8",
                      wishlist ? "cursor-not-allowed" : ""
                    )}
                  >
                    <div className="space-y-4">
                      <ToggleSwitch
                        label="Na biblioteca?"
                        name="library"
                        id="library"
                        disabled={wishlist}
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
                        className="w-full"
                      />
                    )}
                  </div>
                  <div
                    className={clsx(
                      "space-y-2",
                      library ? "cursor-not-allowed" : ""
                    )}
                  >
                    <ToggleSwitch
                      label="Adicionar na Wishlist?"
                      name="wishlist"
                      id="wishlist"
                      disabled={library}
                      checked={wishlist}
                      value={wishlist.toString()}
                      onChange={(e) => setWishlist(e.target.checked)}
                      className="mb-4"
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer
                        bg-gradient-to-r from-[#B27D57] to-[#7F4B30]
                        shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]
                        hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]
                        active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]
                        transition-all duration-200 transform
                        hover:-translate-y-0.5
                        focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer
                        bg-gradient-to-r from-[#B27D57] to-[#7F4B30]
                        shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]
                        hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]
                        active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]
                        transition-all duration-200 transform
                        hover:-translate-y-0.5
                        focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
              {/* )} */}
              {/* Step 3: Progresso da Leitura */}
              {/* {currentStep === 3 && ( */}
              <div className={clsx(currentStep === 3 ? "block" : "hidden")}>
                <div className="space-y-6">
                  <SelectField
                    label="Status"
                    name="status"
                    required
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
                        className="w-full"
                        onChange={(e) => {
                          setInitDate(e.target.value);
                        }}
                      />
                    )}

                    {status === "reading" && (
                      <>
                        <InputField
                          label="Página atual"
                          name="current_page"
                          type="number"
                          className="w-full"
                        />
                      </>
                    )}

                    {status === "finish" && (
                      <div className="space-y-4">
                        <InputField
                          name="finish_date"
                          label="Data finalização da Leitura"
                          type="date"
                          onChange={handleFinishDateChange}
                          className="w-full"
                        />
                        <StarRating
                          name="rating"
                          label="Avaliação"
                          value={rating}
                          onChange={setRating}
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
                      />
                    )}
                  </div>
                  {dateError && (
                    <p className="text-red-600 text-sm mt-1">{dateError}</p>
                  )}
                </div>
                <div className="space-y-6 mt-8">
                  <ToggleSwitch
                    label="Releitura"
                    name="rereading"
                    id="rereading"
                    checked={rereading}
                    value={rereading.toString()}
                    onChange={(e) => setRereading(e.target.checked)}
                    className="mb-4"
                  />
                  <SelectField
                    disabled={!rereading}
                    label="Status da Releitura"
                    name="rereadStatus"
                    required
                    options={[
                      { value: "rereading", label: "Relendo" },
                      { value: "finish", label: "Finalizado" },
                    ]}
                    onChange={(e) => setRereadStatus(e.target.value)}
                    className="w-full"
                  />

                  <div className="space-y-4">
                    {["rereading", "finish"].includes(rereadStatus) && (
                      <InputField
                        label="Data de Início da Releitura"
                        name="rereading_init_date"
                        type="date"
                        className="w-full"
                        onChange={(e) => {
                          setInitDate(e.target.value);
                        }}
                      />
                    )}
                    {rereadStatus === "finish" && (
                      <InputField
                        name="rereading_finish_date"
                        label="Data finalização da Releitura"
                        type="date"
                        onChange={handleFinishDateChange}
                        className="w-full"
                      />
                    )}
                  </div>

                </div>
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer
                        bg-gradient-to-r from-[#B27D57] to-[#7F4B30]
                        shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]
                        hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]
                        active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]
                        transition-all duration-200 transform
                        hover:-translate-y-0.5
                        focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer
                        bg-gradient-to-r from-[#B27D57] to-[#7F4B30]
                        shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]
                        hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]
                        active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]
                        transition-all duration-200 transform
                        hover:-translate-y-0.5
                        focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
              {/* )} */}
              {/* Step 4: Comentários */}
              {/* {currentStep === 4 && ( */}
              <div
                className={clsx(
                  currentStep === 4 ? "block space-y-8" : "hidden"
                )}
              >
                <fieldset className="flex flex-col gap-4 mt-6">
                  <legend className="mb-2 font-semibold text-[#5A3522] text-base">
                    Versão do Livro
                  </legend>
                  <div className="flex flex-row gap-8">
                    <CheckboxField
                      label="Físico"
                      key="physical"
                      type="checkbox"
                      name="physical"
                      id="physical"
                      value={"physical"}
                      className="min-w-[120px]"
                    />
                    <CheckboxField
                      key="audiobook"
                      label="Audiobook"
                      type="checkbox"
                      name="audiobook"
                      id="audiobook"
                      value={"audiobook"}
                      className="min-w-[120px]"
                    />
                    <CheckboxField
                      key="ebook"
                      label="E-book"
                      type="checkbox"
                      name="ebook"
                      id="ebook"
                      value={"ebook"}
                      className="min-w-[120px]"
                    />
                  </div>
                </fieldset>

                <TextareaField
                  label="Citação"
                  name="quote"
                  id=""
                  className="w-full bg-white/80 border-[#AE9372] focus:border-[#7F4B30] focus:ring-2 focus:ring-[#AE9372]/30 transition-all duration-200 text-[#173125] placeholder-[#AE9372]"
                  style={{ fontFamily: "inherit" }}
                />
                <InputField
                  label="Página da citação"
                  name="quote_page"
                  id=""
                  type="number"
                  className="w-24"
                />

                <TextareaField
                  label="Comentários"
                  name="comments"
                  id=""
                  className="w-full bg-white/80 border-[#AE9372] focus:border-[#7F4B30] focus:ring-2 focus:ring-[#AE9372]/30 transition-all duration-200 text-[#173125] placeholder-[#AE9372]"
                  style={{ fontFamily: "inherit" }}
                />
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer
                        bg-gradient-to-r from-[#B27D57] to-[#7F4B30]
                        shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.1)]
                        hover:shadow-[6px_6px_12px_rgba(0,0,0,0.25),-3px_-3px_6px_rgba(255,255,255,0.15)]
                        active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]
                        transition-all duration-200 transform
                        hover:-translate-y-0.5
                        focus:outline-none focus:ring-2 focus:ring-[#B27D57] focus:ring-opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl text-[#E1D9C9] font-medium cursor-pointer
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
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateBook;
