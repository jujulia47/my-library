"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Input,
  Select,
  Textarea,
  Button,
  Card,
  BackButton,
} from "@/components/ui";
import createQuote from "@/actions/createQuote";
import updateQuote from "@/actions/updateQuote";

function safeFrom(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export type BookOption = {
  id: string;
  title: string;
  author: string | null;
};

type QuoteInitial = {
  id: string;
  text: string;
  type: "linked" | "standalone";
  book_id: string | null;
  page: number | null;
  chapter: string | null;
  author_name: string | null;
  source: string | null;
  note: string | null;
};

type Props =
  | {
      mode: "create";
      books: BookOption[];
      initial?: undefined;
      /** Nome do autor pré-preenchido (vindo de /author/[slug] toolbar). */
      initialAuthorName?: string;
    }
  | { mode: "edit"; books: BookOption[]; initial: QuoteInitial };

export default function QuoteForm(props: Props) {
  const sp = useSearchParams();
  const from = safeFrom(sp.get("from"));
  const cancelHref = from ?? (props.mode === "edit" ? `/quote/${""}` : "/quote");

  // Quando o create vem de uma toolbar de autor, default é standalone
  // (citação sem livro vinculado, mas com autor preenchido).
  const initialAuthorFromProps =
    props.mode === "create" ? (props.initialAuthorName ?? "") : "";
  const initialType: "linked" | "standalone" =
    props.mode === "edit"
      ? props.initial.type
      : initialAuthorFromProps
        ? "standalone"
        : "linked";
  const initialBookId = props.mode === "edit" ? props.initial.book_id : null;
  const initialAuthor =
    props.mode === "edit"
      ? (props.initial.author_name ?? "")
      : initialAuthorFromProps;

  const [type, setType] = useState<"linked" | "standalone">(initialType);
  const [bookId, setBookId] = useState<string>(initialBookId ?? "");
  const [authorName, setAuthorName] = useState<string>(initialAuthor);
  const [authorTouched, setAuthorTouched] = useState<boolean>(
    !!initialAuthor && props.mode === "edit",
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Index pra lookup rápido de autor do livro selecionado.
  const bookById = useMemo(() => {
    const map = new Map<string, BookOption>();
    for (const b of props.books) map.set(b.id, b);
    return map;
  }, [props.books]);

  // Quando o user troca o livro: se ele não tocou no campo Autor, auto-preenche.
  const handleBookChange = (id: string) => {
    setBookId(id);
    if (!authorTouched && id) {
      const book = bookById.get(id);
      setAuthorName(book?.author ?? "");
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (from) fd.set("from", from);
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      try {
        const action = props.mode === "create" ? createQuote : updateQuote;
        const result = await action(fd);
        if (result && !result.ok) {
          if (result.field) {
            setFieldErrors({ [result.field]: result.message });
          } else {
            setGenericError(result.message);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setGenericError(err.message);
        }
      }
    });
  };

  const isEdit = props.mode === "edit";

  return (
    <div className="font-body max-w-4xl">
      <div className="mb-4">
        <BackButton fallback="/quote" />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep mb-2">
        {isEdit ? "Editar citação" : "Nova citação"}
      </h1>
      <p className="font-body text-ink-fade italic mb-6">
        {isEdit
          ? "Atualize o trecho ou troque o tipo (vinculada a livro ou avulsa)."
          : "Salve um trecho que ficou com você — de um livro ou de qualquer fonte."}
      </p>

      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          {isEdit && (
            <input type="hidden" name="id" value={props.initial.id} />
          )}
          <input type="hidden" name="type" value={type} />

          {/* Tipo (radio pill) */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-body font-medium text-ink-deep mb-2">
              Tipo
            </legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    value: "linked" as const,
                    label: "Vinculada a livro",
                    activeClass: "bg-moss text-ivory-light border-moss",
                  },
                  {
                    value: "standalone" as const,
                    label: "Citação avulsa",
                    activeClass:
                      "bg-terracota text-ivory-light border-terracota",
                  },
                ]
              ).map((opt) => {
                const checked = type === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors text-sm ${
                      checked
                        ? opt.activeClass
                        : "bg-ivory-light text-ink-deep border-border hover:bg-paper-soft"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type_radio"
                      value={opt.value}
                      checked={checked}
                      onChange={() => setType(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Livro (apenas linked) */}
          {type === "linked" && (
            <Select
              label="Livro"
              name="book_id"
              value={bookId}
              onChange={(e) => handleBookChange(e.target.value)}
              required
              placeholder="Escolha um livro"
              options={props.books.map((b) => ({
                value: b.id,
                label: b.title,
              }))}
              errorText={fieldErrors.book_id}
              helperText={
                props.books.length === 0
                  ? "Você ainda não tem livros cadastrados — crie um em /book/new."
                  : undefined
              }
            />
          )}

          <Textarea
            label="Texto"
            name="text"
            required
            defaultValue={props.mode === "edit" ? props.initial.text : ""}
            placeholder="O trecho que ficou com você."
            autoFocus
            errorText={fieldErrors.text}
          />

          {/* Página + Capítulo (apenas linked) */}
          {type === "linked" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Página"
                name="page"
                type="number"
                min={1}
                defaultValue={
                  props.mode === "edit"
                    ? (props.initial.page ?? "")
                    : ""
                }
                placeholder="Opcional"
              />
              <Input
                label="Capítulo"
                name="chapter"
                defaultValue={
                  props.mode === "edit"
                    ? (props.initial.chapter ?? "")
                    : ""
                }
                placeholder="Opcional"
              />
            </div>
          )}

          {/* Autor (sempre presente; auto-preenchido em linked) */}
          <Input
            label={type === "linked" ? "Autor da citação" : "Autor"}
            name="author_name"
            value={authorName}
            onChange={(e) => {
              setAuthorName(e.target.value);
              setAuthorTouched(true);
            }}
            placeholder={
              type === "linked"
                ? "Auto-preenchido a partir do livro. Edite se for outro autor citado."
                : "Ex.: Carl Sagan, Anônimo…"
            }
            helperText={
              type === "linked"
                ? "Em branco = usa o autor do livro no card."
                : undefined
            }
          />

          {/* Fonte (apenas standalone) */}
          {type === "standalone" && (
            <Input
              label="Fonte"
              name="source"
              defaultValue={
                props.mode === "edit"
                  ? (props.initial.source ?? "")
                  : ""
              }
              placeholder="Ex.: Twitter de @autor, Filme Interestelar, Podcast X ep 42"
            />
          )}

          <Textarea
            label="Nota pessoal"
            name="note"
            defaultValue={
              props.mode === "edit" ? (props.initial.note ?? "") : ""
            }
            placeholder="O que essa passagem deixou em você (opcional)."
          />

          {genericError && (
            <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
              {genericError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              as="Link"
              href={cancelHref}
              variant="ghost"
              type="button"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {isEdit ? "Salvar alterações" : "Cadastrar citação"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
