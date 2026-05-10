"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Input, Textarea, Button, Card, BackButton } from "@/components/ui";
import createSerie from "@/actions/createSerie";

function safeFrom(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export default function SerieMinimal() {
  const sp = useSearchParams();
  const from = safeFrom(sp.get("from"));
  const cancelHref = from ?? "/serie";

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (formData: FormData, andAddBook: boolean) => {
    if (andAddBook) formData.set("and_add_book", "true");
    if (from) formData.set("from", from);
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      try {
        const result = await createSerie(formData);
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
    <div className="font-body max-w-5xl">
      <div className="mb-4">
        <BackButton fallback="/serie" />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep mb-2">
        Adicionar série
      </h1>
      <p className="font-body text-ink-fade italic mb-6">
        O essencial agora — você completa os detalhes depois.
      </p>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const submitter = (e.nativeEvent as SubmitEvent)
              .submitter as HTMLButtonElement | null;
            const fd = new FormData(e.currentTarget);
            submit(fd, submitter?.name === "and_add_book");
          }}
          className="space-y-5"
        >
          <Input
            label="Nome da série"
            name="name"
            required
            placeholder="Ex.: O Senhor dos Anéis"
            autoFocus
            errorText={fieldErrors.name}
          />

          <p className="text-xs italic text-ink-fade leading-relaxed -mt-2">
            O autor é derivado dos livros que você adicionar à série.
          </p>

          <Input
            label="Total de volumes"
            name="qty_volumes"
            type="number"
            min={1}
            placeholder="Ex.: 7"
            helperText="Opcional. Se você ainda não sabe, deixe em branco."
          />

          <Textarea
            label="Descrição"
            name="description"
            placeholder="Sinopse, contexto, por que você quer ler — o que ajudar a se lembrar."
            errorText={fieldErrors.description}
          />

          {genericError && (
            <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
              {genericError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-5 mt-2 border-t border-border">
            <Button
              as="Link"
              href={cancelHref}
              variant="ghost"
              size="md"
              type="button"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              Cadastrar série
            </Button>
            <Button
              type="submit"
              variant="accent-navy"
              loading={isPending}
              name="and_add_book"
              value="true"
            >
              Cadastrar e adicionar volume
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
