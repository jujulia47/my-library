"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  Input,
  Textarea,
  Button,
  Card,
  Select,
  BackButton,
} from "@/components/ui";
import { ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { createAuthorFull } from "@/actions/createAuthorFull";
import { updateAuthor } from "@/actions/updateAuthor";
import { authorPhotoUrl } from "@/services/images";
import { COUNTRY_OPTIONS } from "@/utils/countryLabels";
import type { Database } from "@/utils/typings/supabase";

type AuthorRow = Database["public"]["Tables"]["author"]["Row"];

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const BIO_MAX = 5000;

function safeFrom(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export type AuthorFormProps =
  | { mode: "create" }
  | { mode: "edit"; author: AuthorRow };

export default function AuthorForm(props: AuthorFormProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const from = safeFrom(sp.get("from"));
  const isEdit = props.mode === "edit";
  const author = isEdit ? props.author : null;
  const cancelHref = from ?? (author ? `/author/${author.slug}` : "/");

  const [name, setName] = useState(author?.name ?? "");
  const [country, setCountry] = useState<string>(author?.country ?? "");
  const [birthYear, setBirthYear] = useState(
    author?.birth_year !== null && author?.birth_year !== undefined
      ? String(author.birth_year)
      : "",
  );
  const [deathYear, setDeathYear] = useState(
    author?.death_year !== null && author?.death_year !== undefined
      ? String(author.death_year)
      : "",
  );
  const [bio, setBio] = useState(author?.bio ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Validação client de datas em real-time
  const dateError =
    birthYear.trim() &&
    deathYear.trim() &&
    Number(birthYear) > Number(deathYear)
      ? "Ano de nascimento deve ser anterior ao ano de morte."
      : null;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setGenericError(null);
    const fd = new FormData(e.currentTarget);
    if (from) fd.set("from", from);
    startTransition(async () => {
      try {
        const result = isEdit
          ? await updateAuthor(fd)
          : await createAuthorFull(fd);
        if (!result.ok) {
          if (result.field) setFieldErrors({ [result.field]: result.message });
          else setGenericError(result.message);
          return;
        }
        const target = result.data?.redirectTo ?? cancelHref;
        // Edit + slug NÃO mudou → back() (preserva navegação natural).
        // Edit + slug mudou OU create → replace() pra evitar 404 (back
        // levaria pra URL com slug antigo, inexistente agora).
        const slugFromTarget =
          target.split("?")[0]?.split("/").pop() ?? "";
        const slugChanged = isEdit && slugFromTarget !== author?.slug;
        if (
          isEdit &&
          !slugChanged &&
          typeof window !== "undefined" &&
          window.history.length > 1
        ) {
          router.back();
        } else {
          router.replace(target);
        }
        router.refresh();
      } catch (err: unknown) {
        if (err instanceof Error) setGenericError(err.message);
      }
    });
  };

  return (
    <div className="font-body max-w-xl">
      <div className="mb-4">
        <BackButton fallback={cancelHref} />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep mb-2">
        {isEdit ? "Editar autor" : "Novo autor"}
      </h1>
      {isEdit && (
        <p className="text-ink-fade italic mb-6">{author?.name}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {isEdit && author && (
          <input type="hidden" name="id" value={author.id} />
        )}

        {/* Card 1 — Identificação */}
        <Card>
          <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border">
            Identificação
          </h2>
          <div className="space-y-5">
            <PhotoUpload
              initialPath={author?.photo_url ?? null}
              fallbackName={name || "?"}
            />
            <Input
              label="Nome"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              errorText={fieldErrors.name}
              autoFocus
            />
          </div>
        </Card>

        {/* Card 2 — Origem */}
        <Card>
          <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border">
            Origem
          </h2>
          <div className="space-y-4">
            <Select
              label="País (opcional)"
              name="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[
                { value: "", label: "—" },
                ...COUNTRY_OPTIONS.map((c) => ({
                  value: c.value,
                  label: `${c.code} · ${c.label}`,
                })),
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ano de nascimento"
                name="birth_year"
                type="number"
                min={1}
                max={9999}
                placeholder="1899"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                errorText={fieldErrors.birth_year}
              />
              <Input
                label="Ano de morte"
                name="death_year"
                type="number"
                min={1}
                max={9999}
                placeholder="1986"
                value={deathYear}
                onChange={(e) => setDeathYear(e.target.value)}
                errorText={fieldErrors.death_year}
              />
            </div>
          </div>
        </Card>

        {/* Card 3 — Bio */}
        <Card>
          <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border">
            Sobre
          </h2>
          <Textarea
            label="Bio (opcional)"
            name="bio"
            rows={6}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            errorText={fieldErrors.bio}
            maxLength={BIO_MAX}
            helperText={`${bio.length}/${BIO_MAX}`}
          />
        </Card>

        {dateError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {dateError}
          </p>
        )}
        {genericError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {genericError}
          </p>
        )}

        <div className="border-t border-border pt-5 flex justify-end gap-2">
          <Button as="Link" href={cancelHref} variant="ghost" type="button">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={!!dateError}
          >
            {isEdit ? "Salvar alterações" : "Criar autor"}
          </Button>
        </div>

        {/* Manter país no FormData mesmo quando vazio (Select só envia o
            value selecionado; vazio = null no server). Hidden duplicado não
            é necessário porque o Select já tem name="country" acima. */}
      </form>

    </div>
  );
}

// =====================================================================
// PhotoUpload — preview circular + dropzone faixa fina (similar ao
// CoverUpload mas pra autor: round 3:4, bucket author-photos)
// =====================================================================
function PhotoUpload({
  initialPath,
  fallbackName,
}: {
  initialPath: string | null;
  fallbackName: string;
}) {
  const reactId = useId();
  const inputId = `${reactId}-photo`;
  const initialUrl = initialPath ? authorPhotoUrl(initialPath) : null;

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const validate = (file: File): string | null => {
    if (file.size > MAX_BYTES) return "Arquivo maior que 5MB.";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(ext))
      return "Formato inválido. Use JPG, PNG ou WebP.";
    return null;
  };

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setRemoved(false);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  };

  const handleRemove = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setRemoved(true);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const initials = fallbackName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        className="block text-sm font-body font-medium text-ink-deep"
      >
        Foto
      </label>

      <div className="flex items-start gap-4">
        {/* Preview retrato 3:4 */}
        <div
          className="w-[120px] flex-shrink-0 relative rounded-md overflow-hidden border border-border bg-cappuccino/15"
          style={{ aspectRatio: "3 / 4" }}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={`Foto de ${fallbackName}`}
              fill
              className="object-cover"
              sizes="120px"
              unoptimized={previewUrl.startsWith("blob:")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-3xl text-cappuccino-soft">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={clsx(
              "flex items-center justify-center gap-2 w-full px-3 py-3 rounded-md border-2 border-dashed cursor-pointer text-sm transition-colors",
              isDragging
                ? "border-gold bg-gold/10"
                : "border-border bg-ivory-light hover:bg-paper",
            )}
          >
            <ArrowUpTrayIcon className="w-4 h-4 text-ink-fade flex-shrink-0" />
            <span className="text-ink-soft text-center">
              <span className="font-medium text-ink-deep">
                {previewUrl ? "Trocar foto" : "Enviar foto"}
              </span>
              <span className="block text-xs italic text-ink-fade mt-0.5">
                JPG, PNG ou WebP até 5MB
              </span>
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 text-sm text-burgundy hover:text-burgundy-soft transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Remover foto
            </button>
          )}
          {error && <p className="text-xs font-body text-burgundy">{error}</p>}
          {removed && (
            <input type="hidden" name="photo_removed" value="true" />
          )}
        </div>
      </div>
    </div>
  );
}
