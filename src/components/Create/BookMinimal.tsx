"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Input,
  Select,
  Button,
  Card,
  AuthorMultiSelect,
  BackButton,
  CoverUpload,
  SerieSelect,
  type AuthorOption,
  type SerieOption,
} from "@/components/ui";
import LinkBookToSerieModal from "@/components/forms/LinkBookToSerieModal";
import { createBookMinimal } from "@/actions/createBookMinimal";
import { playStamp } from "@/utils/sounds";
import { lookupBookByIsbn } from "@/actions/lookupBookByIsbn";
import { createAuthor } from "@/actions/createAuthor";
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

function safeFrom(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

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

type Props = {
  initialSerie?: SerieOption | null;
  initialSerieSlug?: string | null;
  initialSerieOccupiedVolumes?: number[];
  initialVolume?: number | null;
  initialAuthors?: AuthorOption[];
  initialTitle?: string;
  fromWishlist?: { id: string; title: string } | null;
};

export default function BookMinimal({
  initialSerie = null,
  initialSerieSlug = null,
  initialSerieOccupiedVolumes = [],
  initialVolume = null,
  initialAuthors,
  initialTitle,
  fromWishlist = null,
}: Props = {}) {
  const router = useRouter();
  const sp = useSearchParams();
  const from = safeFrom(sp.get("from"));
  const cancelHref = from ?? "/book";

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(cancelHref);
    }
  };

  const [authors, setAuthors] = useState<AuthorOption[]>(
    initialAuthors ?? [],
  );
  const [serie, setSerie] = useState<SerieOption | null>(initialSerie);
  const [serieExpanded, setSerieExpanded] = useState(!!initialSerie);
  const [linkOpen, setLinkOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sessão 17.11: lookup por ISBN — title/language/isbn passam a ser
  // controlled pra que o "Buscar" possa preencher os campos. Cover via
  // externalFile (CoverUpload baixa do URL e injeta no input via DataTransfer).
  const [title, setTitle] = useState<string>(
    fromWishlist?.title ?? initialTitle ?? "",
  );
  const [isbn, setIsbn] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [lookupStatus, setLookupStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "success"; source: string }
    | { state: "error"; message: string }
  >({ state: "idle" });
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleIsbnLookup = async () => {
    const trimmed = isbn.trim();
    if (!trimmed) {
      setLookupStatus({ state: "error", message: "Digite um ISBN primeiro." });
      return;
    }
    setIsLookingUp(true);
    setLookupStatus({ state: "loading" });
    try {
      const result = await lookupBookByIsbn(trimmed);
      if (!result.ok) {
        setLookupStatus({ state: "error", message: result.message });
        return;
      }
      const d = result.data;
      // Preenche campos básicos (sobrescreve só se vier valor da API)
      if (d.title) setTitle(d.title);
      if (d.language) setLanguage(d.language);
      if (d.isbn13) setIsbn(d.isbn13);

      // Autores: para cada nome, cria/encontra via createAuthor (a action
      // já trata "já existe"). Adiciona à lista atual sem duplicar.
      if (d.authors && d.authors.length > 0) {
        const created: AuthorOption[] = [];
        for (const name of d.authors) {
          const r = await createAuthor(name);
          if (r.ok) created.push({ id: r.id, name: r.name });
        }
        setAuthors((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const merged = [...prev];
          for (const a of created) {
            if (!existingIds.has(a.id)) merged.push(a);
          }
          return merged;
        });
      }

      // Capa: baixa o URL como blob e cria File pra injetar no CoverUpload
      if (d.cover_url) {
        try {
          const res = await fetch(d.cover_url);
          if (res.ok) {
            const blob = await res.blob();
            const ext = blob.type.split("/")[1] || "jpg";
            const file = new File(
              [blob],
              `cover-${d.isbn13 ?? trimmed}.${ext}`,
              { type: blob.type || "image/jpeg" },
            );
            setCoverFile(file);
          }
        } catch {
          // Falha de download da capa não deve quebrar o lookup todo
        }
      }

      setLookupStatus({ state: "success", source: result.source });
    } catch {
      setLookupStatus({
        state: "error",
        message: "Erro ao buscar — verifique sua conexão.",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const submit = (formData: FormData, andRegister: boolean) => {
    if (andRegister) formData.set("and_register_reading", "true");
    if (from) formData.set("from", from);
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      try {
        const result = await createBookMinimal(formData);
        if (!result.ok) {
          if (result.field) {
            setFieldErrors({ [result.field]: result.message });
          } else {
            setGenericError(result.message);
          }
          return;
        }
        // Create flow: usa `replace` pra que o detail da nova entidade
        // substitua o /book/new no history stack — Voltar do detail vai
        // direto pra origem (lista) em vez de cair no form em branco.
        // Carimbo de "livro catalogado" antes do redirect.
        playStamp();
        const target = result.data?.redirectTo ?? "/book";
        router.replace(target);
        router.refresh();
      } catch (err: unknown) {
        if (err instanceof Error) setGenericError(err.message);
      }
    });
  };

  return (
    <div className="font-body max-w-5xl">
      <div className="mb-4">
        <BackButton fallback="/book" />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep mb-2">
        Catalogar livro
      </h1>
      <p className="font-body text-ink-fade italic mb-6">
        O essencial agora — você completa os detalhes depois.
      </p>

      {initialSerie && (
        <Card
          variant="surface"
          className="mb-6 border-l-[3px] border-l-gold"
        >
          <p className="font-display text-base text-ink-deep">
            Adicionando volume à série{" "}
            <span className="italic">{initialSerie.name}</span>
          </p>
          <p className="text-sm italic text-ink-soft mt-1">
            Já tem esse livro cadastrado?{" "}
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className="text-gold-deep underline hover:text-ink-deep transition-colors"
            >
              Vincular livro existente
            </button>
            .
          </p>
        </Card>
      )}

      {fromWishlist && (
        <Card
          variant="surface"
          className="mb-6 border-l-[3px] border-l-gold"
        >
          <p className="font-display text-base text-ink-deep">
            ✓ Adicionando livro vindo da sua wishlist
          </p>
          <p className="text-sm italic text-ink-soft mt-1">
            <span className="italic">&quot;{fromWishlist.title}&quot;</span>{" "}
            será removido da wishlist após cadastrar.
          </p>
        </Card>
      )}

      <Card>
        <form
          id="book-minimal-form"
          onSubmit={(e) => {
            e.preventDefault();
            const submitter = (e.nativeEvent as SubmitEvent)
              .submitter as HTMLButtonElement | null;
            const fd = new FormData(e.currentTarget);
            if (fromWishlist) fd.set("from_wishlist", fromWishlist.id);
            submit(fd, submitter?.name === "and_register_reading");
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8">
            {/* Coluna esquerda: campos */}
            <div className="space-y-5 order-2 md:order-1">
              <Input
                label="Título"
                name="title"
                required
                placeholder="Ex.: O nome do vento"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                errorText={fieldErrors.title}
              />

              <AuthorMultiSelect
                label="Autores"
                value={authors}
                onChange={setAuthors}
                hiddenFieldName="author_ids"
                helperText="Digite e selecione, ou crie um autor novo."
              />

              {/* Série inline (expansível) */}
              {!serieExpanded && !serie ? (
                <button
                  type="button"
                  onClick={() => setSerieExpanded(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-gold-deep hover:text-ink-deep underline transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar a uma série
                </button>
              ) : (
                <div className="rounded-md border border-border bg-paper/40 p-4 space-y-3">
                  <SerieSelect
                    label="Série"
                    value={serie}
                    onChange={setSerie}
                    hiddenFieldName="serie_id"
                  />
                  <Input
                    label="Volume"
                    name="volume"
                    type="number"
                    step="0.5"
                    min={0}
                    placeholder="Ex.: 1 ou 2.5"
                    defaultValue={initialVolume ?? undefined}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSerie(null);
                      setSerieExpanded(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-ink-fade hover:text-burgundy underline transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                    Remover da série
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <Input
                  label="ISBN"
                  name="isbn"
                  placeholder="Sem ISBN? Tudo bem."
                  value={isbn}
                  onChange={(e) => {
                    setIsbn(e.target.value);
                    if (lookupStatus.state !== "idle")
                      setLookupStatus({ state: "idle" });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleIsbnLookup();
                    }
                  }}
                  errorText={fieldErrors.isbn}
                  helperText="Tem o ISBN? Clique em buscar pra preencher título, autores, idioma e capa automaticamente."
                />
                <div className="flex items-start gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleIsbnLookup}
                    loading={isLookingUp}
                    disabled={!isbn.trim() || isLookingUp}
                    leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
                  >
                    Buscar pelo ISBN
                  </Button>
                  {lookupStatus.state === "success" && (
                    <span className="text-xs italic text-moss self-center">
                      ✓ Preenchido via{" "}
                      {lookupStatus.source === "google"
                        ? "Google Books"
                        : "Open Library"}
                    </span>
                  )}
                  {lookupStatus.state === "error" && (
                    <span className="text-xs italic text-burgundy max-w-md leading-snug">
                      {lookupStatus.message}
                    </span>
                  )}
                </div>
              </div>

              <Select
                label="Idioma"
                name="language"
                options={languageOptions}
                placeholder="Escolha um idioma"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>

            {/* Coluna direita: capa */}
            <div className="order-1 md:order-2">
              <div className="md:sticky md:top-4">
                <CoverUpload
                  fallbackTitle="Capa"
                  externalFile={coverFile}
                />
              </div>
            </div>
          </div>

          {genericError && (
            <p className="mt-5 text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
              {genericError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-5 mt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              name="submit_main"
            >
              Cadastrar livro
            </Button>
            <Button
              type="submit"
              variant="accent-moss"
              loading={isPending}
              name="and_register_reading"
              value="true"
            >
              Cadastrar e registrar leitura
            </Button>
          </div>
        </form>
      </Card>

      {initialSerie && (
        <LinkBookToSerieModal
          open={linkOpen}
          onClose={() => setLinkOpen(false)}
          serieId={initialSerie.id}
          serieSlug={initialSerieSlug ?? undefined}
          occupiedVolumes={initialSerieOccupiedVolumes}
          onSuccess={() => {
            // Vinculou um livro existente — vai pra detail da série em vez
            // de ficar no form de criar livro vazio.
            setLinkOpen(false);
            if (initialSerieSlug) {
              router.push(`/serie/${initialSerieSlug}`);
            } else {
              router.refresh();
            }
          }}
        />
      )}
    </div>
  );
}
