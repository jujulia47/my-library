"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Input,
  Textarea,
  Select,
  Button,
  Card,
  AuthorMultiSelect,
  BackButton,
  CategoryMultiSelect,
  CoverUpload,
  SerieSelect,
  type AuthorOption,
  type CategoryOption,
  type SerieOption,
} from "@/components/ui";
import {
  BookOpenIcon,
  TagIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { OwnershipFields } from "@/components/forms/OwnershipFields";
import type { SubscriptionOption } from "@/components/forms/SubscriptionSelect";
import { updateBookFull } from "@/actions/updateBookFull";

function safeFrom(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}
import { imagesUrl } from "@/services/images";
import type { Database } from "@/utils/typings/supabase";

type BookRow = Database["public"]["Tables"]["book"]["Row"];
type SerieRow = Database["public"]["Tables"]["serie"]["Row"];
type BookFormat = Database["public"]["Enums"]["book_format"];

const languageOptions = [
  { value: "pt_BR", label: "Português (BR)" },
  { value: "en", label: "Inglês" },
  { value: "es", label: "Espanhol" },
  { value: "fr", label: "Francês" },
  { value: "it", label: "Italiano" },
  { value: "de", label: "Alemão" },
  { value: "ja", label: "Japonês" },
  { value: "other", label: "Outro" },
];

export type BookFullProps = {
  book: BookRow;
  initialAuthors: AuthorOption[];
  initialCategories: CategoryOption[];
  allCategories: CategoryOption[];
  allSeries: Pick<SerieRow, "id" | "name">[];
  subscriptions: SubscriptionOption[];
};

export default function BookFull({
  book,
  initialAuthors,
  initialCategories,
  allCategories,
  allSeries,
  subscriptions,
}: BookFullProps) {
  const sp = useSearchParams();
  const from = safeFrom(sp.get("from"));
  const cancelHref = from ?? `/book/${book.slug}`;

  const [authors, setAuthors] = useState<AuthorOption[]>(initialAuthors);
  const [categories, setCategories] =
    useState<CategoryOption[]>(initialCategories);
  const [categoriesValid, setCategoriesValid] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const initialUrl = book.cover ? imagesUrl(book.cover) : null;
  const formatsOwned = (book.formats_owned ?? []) as BookFormat[];
  // Os três checkboxes precisam ser controlados pra OwnershipFields decidir
  // dinamicamente quais opções de "Estado físico" mostrar:
  //   físico marcado     → "Em casa / Emprestei / Doei / etc."
  //   só e-book          → "Kindle"
  //   só audiobook       → "Audible"
  //   ambos digitais     → "Kindle" + "Audible"
  const [formats, setFormats] = useState({
    physical: formatsOwned.includes("physical"),
    ebook: formatsOwned.includes("ebook"),
    audiobook: formatsOwned.includes("audiobook"),
  });
  const toggleFormat = (key: keyof typeof formats) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormats((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  // Pré-popula a série atual (se houver) via lookup em `allSeries` — o tipo
  // `book` não traz `serie_name`. SerieSelect aceita value/onChange e renderiza
  // chip com ╳ pra desvincular; cria série inline também (sessão 17.1).
  const initialSerie: SerieOption | null = book.serie_id
    ? allSeries.find((s) => s.id === book.serie_id) ?? null
    : null;
  const [serie, setSerie] = useState<SerieOption | null>(initialSerie);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (from) fd.set("from", from);
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      try {
        const result = await updateBookFull(fd);
        if (result && !result.ok) {
          if (result.field) {
            setFieldErrors({ [result.field]: result.message });
          } else {
            setGenericError(result.message);
          }
        }
      } catch (err: unknown) {
        // redirect() lança NEXT_REDIRECT em sucesso — Next intercepta. Filtra.
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setGenericError(err.message);
        }
      }
    });
  };

  return (
    <div className="font-body max-w-4xl">
      <div className="mb-4">
        <BackButton fallback={`/book/${book.slug}`} />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep">
        Editar livro
      </h1>
      <p className="font-body text-ink-fade italic mb-6">{book.title}</p>

      <form onSubmit={onSubmit} className="space-y-6 pb-24">
        <input type="hidden" name="id" value={book.id} />

        {/* Sessão 17.10: cada Card de seção ganha border-l-3 colorida + ícone
            no header pra ajudar a navegar o form longo. */}
        {/* Card 1 — Dados do livro (Identificação): navy */}
        <Card className="border-l-[3px] border-l-navy">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-navy" aria-hidden />
            Dados do livro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
            {/* Coluna esquerda: campos textuais + série/volume */}
            <div className="space-y-5 order-2 md:order-1">
              <Input
                label="Título"
                name="title"
                required
                defaultValue={book.title}
                errorText={fieldErrors.title}
              />
              <Input
                label="Título original"
                name="original_title"
                defaultValue={book.original_title ?? ""}
                className="italic"
              />

              <AuthorMultiSelect
                label="Autores"
                value={authors}
                onChange={setAuthors}
                hiddenFieldName="author_ids"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="ISBN"
                  name="isbn"
                  defaultValue={book.isbn ?? ""}
                  placeholder="Sem ISBN? Tudo bem."
                  errorText={fieldErrors.isbn}
                />
                <Input
                  label="Editora"
                  name="publisher"
                  defaultValue={book.publisher ?? ""}
                />
                <Input
                  label="Ano de publicação"
                  name="publication_year"
                  type="number"
                  defaultValue={book.publication_year ?? ""}
                />
                <Input
                  label="Páginas"
                  name="pages"
                  type="number"
                  defaultValue={book.pages ?? ""}
                />
                <Select
                  label="Idioma"
                  name="language"
                  options={languageOptions}
                  defaultValue={book.language ?? ""}
                  placeholder="Escolha um idioma"
                />
              </div>

              <Textarea
                label="Sinopse"
                name="synopsis"
                defaultValue={book.synopsis ?? ""}
                placeholder="Resumo, contracapa, etc."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <SerieSelect
                    label="Série"
                    value={serie}
                    onChange={setSerie}
                    hiddenFieldName="serie_id"
                    helperText="Busque uma série existente ou crie nova."
                  />
                </div>
                <Input
                  label="Volume"
                  name="volume"
                  type="number"
                  defaultValue={book.volume ?? ""}
                />
              </div>
            </div>

            {/* Coluna direita: capa */}
            <div className="order-1 md:order-2">
              <div className="md:sticky md:top-4">
                <CoverUpload
                  initialUrl={initialUrl}
                  fallbackTitle={book.title}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2 — Categorias: cappuccino */}
        <Card className="border-l-[3px] border-l-cappuccino">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-cappuccino" aria-hidden />
            Categorias
          </h2>
          <CategoryMultiSelect
            value={categories}
            onChange={setCategories}
            options={allCategories}
            hiddenFieldName="category_ids"
            onValidationChange={setCategoriesValid}
            helperText="Pode escolher mais de uma. Crie novas em /category."
          />
        </Card>

        {/* Card 3 — Posse (sessão 17.2 — unificou Posse + Aquisição).
            Estado físico (8 valores granulares) controla quais campos extra
            aparecem; <OwnershipFields> cuida do condicional. Formatos físicos
            ficam aqui também porque conceitualmente fazem parte de "posse".
            Sessão 17.10: border-l moss + ícone ArchiveBox. */}
        <Card className="border-l-[3px] border-l-moss">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border flex items-center gap-2">
            <ArchiveBoxIcon className="w-5 h-5 text-moss" aria-hidden />
            Acervo
          </h2>

          <fieldset className="space-y-2 mb-6">
            <legend className="text-sm font-body font-medium text-ink-deep mb-2">
              Formatos
            </legend>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "physical" as const, label: "Físico" },
                { value: "ebook" as const, label: "E-book" },
                { value: "audiobook" as const, label: "Audiobook" },
              ].map((f) => (
                <label
                  key={f.value}
                  className="inline-flex items-center gap-2 cursor-pointer text-sm text-ink-deep"
                >
                  <input
                    type="checkbox"
                    name={`format_${f.value}`}
                    checked={formats[f.value]}
                    onChange={toggleFormat(f.value)}
                    className="w-4 h-4 rounded border-border accent-moss focus:ring-moss/30"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>

          <OwnershipFields
            initial={{
              ownership_status: book.ownership_status,
              purchase_origin: book.purchase_origin,
              purchase_price:
                book.purchase_price !== null ? Number(book.purchase_price) : null,
              acquired_at: book.acquired_at,
              lent_out_at: book.lent_out_at,
              borrowed_at: book.borrowed_at,
              returned_at: book.returned_at,
              returned_to_acervo_at: book.returned_to_acervo_at,
              disposed_date: book.disposed_date,
              borrowed_from: book.borrowed_from,
              lent_to: book.lent_to,
              subscription_id: book.subscription_id,
            }}
            subscriptions={subscriptions}
            fieldErrors={fieldErrors}
            formats={formats}
          />

          {/* Hidden: previousStatus pra a action detectar transições server-
              side (ex: lent_out → owned). Quando o usuário tira o formato
              físico, neutralizamos pra "owned" — caso contrário, um livro que
              estava "lent_out" e perdeu o físico dispararia a validação de
              "data em que voltou pro acervo", que não faz sentido nesse fluxo. */}
          <input
            type="hidden"
            name="previous_ownership_status"
            value={formats.physical ? book.ownership_status : "owned"}
          />
        </Card>

        {genericError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {genericError}
          </p>
        )}

        {/* Footer fixo no fundo */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-ivory/95 backdrop-blur-sm border-t border-border z-30">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-end gap-2">
            <Button
              as="Link"
              href={cancelHref}
              variant="ghost"
              type="button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              disabled={!categoriesValid}
              title={
                categoriesValid
                  ? undefined
                  : "Resolva os erros antes de salvar"
              }
            >
              Salvar alterações
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
