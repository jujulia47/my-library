"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Input,
  Textarea,
  Button,
  Card,
  BackButton,
} from "@/components/ui";
import StarRating from "@/components/FormFields/StarRating";
import updateSerie from "@/actions/updateSerie";
import { formatDate } from "@/utils/formatDate";
import type { Database } from "@/utils/typings/supabase";
import type { DerivedSerieDates } from "@/services/serieDates";

function safeFrom(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

type SerieRow = Database["public"]["Tables"]["serie"]["Row"];
type SerieStatus = Database["public"]["Enums"]["serie_status"];

const statusOptions: { value: SerieStatus; label: string; activeClass: string }[] = [
  { value: "tbr", label: "Quero ler", activeClass: "bg-ink-fade text-ivory-light border-ink-fade" },
  { value: "reading", label: "Lendo", activeClass: "bg-gold text-ink-deep border-gold" },
  { value: "paused", label: "Pausada", activeClass: "bg-olive text-ivory-light border-olive" },
  { value: "finished", label: "Concluída", activeClass: "bg-moss text-ivory-light border-moss" },
  { value: "abandoned", label: "Abandonada", activeClass: "bg-burgundy text-ivory-light border-burgundy" },
];

/**
 * Matriz de visibilidade dos campos por status (spec da 6.3 fase 1).
 *
 * | Status     | Comecei em | Concluí em | Abandonei em | Avaliação | Resenha |
 * | tbr        |     ❌     |     ❌     |      ❌      |    ❌     |   ❌    |
 * | reading    |     ✓      |     ❌     |      ❌      |    ❌     |   ❌    |
 * | paused     |     ✓      |     ❌     |      ❌      |    ❌     |   ❌    |
 * | finished   |     ✓      |     ✓      |      ❌      |    ✓      |   ✓     |
 * | abandoned  |     ✓      |     ❌     |      ✓       |    ✓ opc  |   ✓     |
 *
 * "Concluí em" e "Abandonei em" usam o mesmo campo no banco
 * (`serie.finish_date`); só o label muda.
 */
function visibleFields(status: SerieStatus) {
  return {
    startDate: status !== "tbr",
    finishedAt: status === "finished",
    abandonedAt: status === "abandoned",
    rating: status === "finished" || status === "abandoned",
    review: status === "finished" || status === "abandoned",
  };
}

export type SerieFullProps = {
  serie: SerieRow;
  derivedDates: DerivedSerieDates;
};

export default function SerieFull({
  serie,
  derivedDates,
}: SerieFullProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const from = safeFrom(sp.get("from"));
  const cancelHref = from ?? "/serie";

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(cancelHref);
    }
  };

  const [status, setStatus] = useState<SerieStatus>(serie.status);
  const [rating, setRating] = useState<number>(serie.rating ?? 0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fields = visibleFields(status);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (from) fd.set("from", from);
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      try {
        const result = await updateSerie(fd);
        if (!result.ok) {
          if (result.field) {
            setFieldErrors({ [result.field]: result.message });
          } else {
            setGenericError(result.message);
          }
          return;
        }
        const target = result.data?.redirectTo ?? cancelHref;
        const slugFromTarget =
          target.split("?")[0]?.split("/").pop() ?? "";
        const slugChanged = slugFromTarget !== serie.slug;
        if (
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
    <div className="font-body max-w-4xl">
      <div className="mb-4">
        <BackButton fallback={`/serie/${serie.slug}`} />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep">
        Editar série
      </h1>
      <p className="font-body text-ink-fade italic mb-6">{serie.name}</p>

      <form onSubmit={onSubmit} className="space-y-6 pb-24">
        <input type="hidden" name="id" value={serie.id} />

        {/* Card 1 — Sobre a série */}
        <Card>
          <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border">
            Sobre a série
          </h2>
          <div className="space-y-5">
            <Input
              label="Nome"
              name="name"
              required
              defaultValue={serie.name}
              errorText={fieldErrors.name}
            />
            <Textarea
              label="Descrição"
              name="description"
              defaultValue={serie.description ?? ""}
            />
            <Input
              label="Total de volumes"
              name="qty_volumes"
              type="number"
              min={1}
              defaultValue={serie.qty_volumes ?? ""}
            />

            <fieldset className="space-y-2">
              <legend className="text-sm font-body font-medium text-ink-deep mb-2">
                Status
              </legend>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => {
                  const checked = status === opt.value;
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
                        name="status"
                        value={opt.value}
                        checked={checked}
                        onChange={() => setStatus(opt.value)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </Card>

        {/* Card 2 — Datas (override opcional). Some quando status = tbr; campos
            internos seguem matriz. "Concluí em" / "Abandonei em" são o mesmo
            campo no banco (finish_date), só muda o label. */}
        {fields.startDate && (
          <Card>
            <h2 className="font-display text-xl font-medium text-ink-deep mb-2 pb-3 border-b border-border">
              Datas
            </h2>
            <p className="text-[11px] uppercase tracking-wider text-ink-fade mb-4">
              Datas calculadas a partir das suas leituras. Preencha aqui apenas se quiser sobrescrever.
            </p>
            <div
              className={`grid grid-cols-1 ${fields.finishedAt || fields.abandonedAt ? "sm:grid-cols-2" : ""} gap-4`}
            >
              <div className="space-y-1">
                <Input
                  label="Comecei em"
                  name="start_date"
                  type="date"
                  defaultValue={serie.start_date ?? ""}
                />
                {derivedDates.derivedStartDate && (
                  <p className="text-xs italic text-ink-fade">
                    Calculada: {formatDate(derivedDates.derivedStartDate)}
                  </p>
                )}
              </div>
              {(fields.finishedAt || fields.abandonedAt) && (
                <div className="space-y-1">
                  <Input
                    label={fields.finishedAt ? "Concluí em" : "Abandonei em"}
                    name="finish_date"
                    type="date"
                    defaultValue={serie.finish_date ?? ""}
                  />
                  {fields.finishedAt && derivedDates.derivedFinishDate && (
                    <p className="text-xs italic text-ink-fade">
                      Calculada: {formatDate(derivedDates.derivedFinishDate)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Card 3 — Avaliação e resenha. Só finished/abandoned. */}
        {(fields.rating || fields.review) && (
          <Card>
            <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border">
              Avaliação e resenha
            </h2>
            <div className="space-y-5">
              {fields.rating && (
                <StarRating
                  label={
                    status === "abandoned" ? "Avaliação (opcional)" : "Avaliação"
                  }
                  value={rating}
                  onChange={setRating}
                  name="rating"
                />
              )}
              {fields.review && (
                <Textarea
                  label={
                    status === "abandoned"
                      ? "Por que abandonei?"
                      : "Resenha"
                  }
                  name="review"
                  defaultValue={serie.review ?? ""}
                  placeholder={
                    status === "abandoned"
                      ? "O que fez você desistir? (opcional)"
                      : "O que ficou pra você?"
                  }
                />
              )}
            </div>
          </Card>
        )}

        {genericError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {genericError}
          </p>
        )}

        {/* Footer fixo */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-ivory/95 backdrop-blur-sm border-t border-border z-30">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              Salvar alterações
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
