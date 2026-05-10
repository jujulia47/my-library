"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import BookCoverFallback from "./BookCoverFallback";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export type CoverUploadProps = {
  initialUrl?: string | null;
  name?: string;
  removedFieldName?: string;
  label?: string;
  fallbackTitle?: string;
  /**
   * File externo (ex.: capa baixada do ISBN lookup). Quando esse prop
   * muda pra um File, o preview e o input.files são populados via
   * DataTransfer — substitui o que estava antes (mas o user pode
   * trocar/remover normalmente).
   */
  externalFile?: File | null;
};

export default function CoverUpload({
  initialUrl,
  name = "cover",
  removedFieldName = "cover_removed",
  label = "Capa",
  fallbackTitle = "?",
  externalFile,
}: CoverUploadProps) {
  const reactId = useId();
  const inputId = `${reactId}-cover`;

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Quando recebe um File externo (ex.: ISBN lookup baixou a capa), aplica
  // no preview e no input via DataTransfer (única forma de programar
  // file inputs por segurança).
  useEffect(() => {
    if (!externalFile || !inputRef.current) return;
    try {
      const dt = new DataTransfer();
      dt.items.add(externalFile);
      inputRef.current.files = dt.files;
    } catch {
      // DataTransfer pode falhar em alguns browsers — ignora silenciosamente
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(externalFile);
    objectUrlRef.current = url;
    setPreviewUrl(url);
    setRemoved(false);
    setError(null);
  }, [externalFile]);

  const validate = (file: File): string | null => {
    if (file.size > MAX_BYTES) return "Arquivo maior que 5MB.";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return "Formato inválido. Use JPG, PNG ou WebP.";
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
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

  const dropzoneLabel = previewUrl
    ? "Substituir capa"
    : "Clique para enviar ou arraste uma imagem";

  return (
    <div className="space-y-3">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-body font-medium text-ink-deep"
        >
          {label}
        </label>
      )}

      {/* Preview em destaque, centralizado */}
      <div className="flex justify-center">
        <div className="w-[200px]">
          {previewUrl ? (
            <div
              className="relative w-full rounded-md overflow-hidden border border-ink-deep/30"
              style={{ aspectRatio: "2 / 3" }}
            >
              <Image
                src={previewUrl}
                alt="Pré-visualização da capa"
                fill
                className="object-cover"
                sizes="200px"
                unoptimized={previewUrl.startsWith("blob:")}
              />
            </div>
          ) : (
            <BookCoverFallback
              title={fallbackTitle}
              size="lg"
              className="w-full"
            />
          )}
        </div>
      </div>

      {/* Dropzone como faixa horizontal fina */}
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          "flex items-center justify-center gap-2 w-full h-[60px] px-4 rounded-md border-2 border-dashed cursor-pointer transition-colors duration-150",
          isDragging
            ? "border-gold bg-gold/10"
            : "border-border bg-ivory-light hover:bg-paper",
        )}
      >
        <ArrowUpTrayIcon className="w-5 h-5 text-ink-fade flex-shrink-0" />
        <span className="text-sm text-ink-soft text-center">
          <span className="font-medium text-ink-deep">{dropzoneLabel}</span>
          {!previewUrl && (
            <span className="hidden sm:inline text-ink-fade italic ml-1">
              · JPG, PNG ou WebP até 5MB
            </span>
          )}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleInputChange}
        />
      </label>

      {previewUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="inline-flex items-center gap-1.5 text-sm text-burgundy hover:text-burgundy-soft transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          Remover capa
        </button>
      )}

      {error && <p className="text-xs font-body text-burgundy">{error}</p>}

      {removed && (
        <input type="hidden" name={removedFieldName} value="true" />
      )}
    </div>
  );
}
