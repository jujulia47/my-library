"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Input,
  Textarea,
  Button,
  Card,
  BackButton,
} from "@/components/ui";
import createCollection from "@/actions/createCollection";
import type { Database } from "@/utils/typings/supabase";

type CollectionType = Database["public"]["Enums"]["collection_type"];

const TYPE_OPTIONS: {
  value: CollectionType;
  label: string;
  hint: string;
}[] = [
  {
    value: "shelf",
    label: "Estante",
    hint: "Agrupa livros por tema (ex: Não lidos, Favoritos).",
  },
  {
    value: "list",
    label: "Lista",
    hint: "Lista temporária com prazo opcional (ex: 'Ler em janeiro').",
  },
  {
    value: "challenge",
    label: "Desafio",
    hint: "Meta de leitura num período (ex: 30 livros em 2026).",
  },
  {
    value: "subscription",
    label: "Assinatura",
    hint: "Livros recebidos por assinatura (ex: TAG, PerSe).",
  },
  {
    value: "wishlist",
    label: "Wishlist",
    hint: "Livros que você quer comprar (ex: 'Black Friday', 'Aniversário').",
  },
];

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function CollectionMinimal() {
  const router = useRouter();
  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/collection");
    }
  };
  const [type, setType] = useState<CollectionType>("shelf");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalCount, setGoalCount] = useState("");
  const [provider, setProvider] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Quando troca tipo, zera campos não-aplicáveis (matriz de campos).
  const onTypeChange = (next: CollectionType) => {
    setType(next);
    if (next !== "challenge") setGoalCount("");
    if (next !== "subscription") setProvider("");
    if (next === "shelf") {
      setStartDate("");
      setEndDate("");
    }
    if (next === "subscription") setEndDate("");
    // wishlist: mantém datas (opcionais), zera goal e provider (acima)
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setGenericError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await createCollection(fd);
        if (!result.ok) {
          if (result.field) setFieldErrors({ [result.field]: result.message });
          else setGenericError(result.message);
          return;
        }
        const target = result.data?.redirectTo ?? "/collection";
        router.replace(target);
        router.refresh();
      } catch (err: unknown) {
        if (err instanceof Error) setGenericError(err.message);
      }
    });
  };

  // Validação de datas client-side.
  const dateError =
    startDate && endDate && endDate < startDate
      ? "A data de fim não pode ser anterior à data de início."
      : null;

  // Preview de datas raw (Card 3).
  const datesPreview =
    startDate && endDate
      ? `${formatShortDate(startDate)} → ${formatShortDate(endDate)}`
      : startDate
        ? `desde ${formatShortDate(startDate)}`
        : endDate
          ? `até ${formatShortDate(endDate)}`
          : null;

  const showCard2 = type !== "shelf";

  return (
    <div className="font-body max-w-3xl">
      <div className="mb-4">
        <BackButton fallback="/collection" />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep mb-2">
        Nova coleção
      </h1>
      <p className="text-ink-fade italic mb-6">
        Escolha o tipo e dê um nome. Items podem ser adicionados depois na
        página da coleção.
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Card 1 — Sobre a coleção */}
        <Card>
          <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border">
            Sobre a coleção
          </h2>

          <fieldset className="mb-5">
            <legend className="text-[11px] uppercase tracking-wider text-ink-fade mb-2">
              Tipo
            </legend>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const checked = type === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={
                      checked
                        ? "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-body bg-ink-deep text-ivory-light border-ink-deep transition-colors"
                        : "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-body bg-ivory-light border-border text-ink-soft hover:bg-paper-soft hover:text-ink-deep transition-colors"
                    }
                  >
                    <input
                      type="radio"
                      name="type"
                      value={opt.value}
                      checked={checked}
                      onChange={() => onTypeChange(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
            <p className="text-xs italic text-ink-fade mt-2">
              {TYPE_OPTIONS.find((o) => o.value === type)?.hint}
            </p>
          </fieldset>

          <div className="space-y-4">
            <Input
              label="Nome"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              errorText={fieldErrors.name}
              autoFocus
            />
            <Textarea
              label="Descrição (opcional)"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </Card>

        {/* Card 2 — Configuração específica do tipo */}
        {showCard2 && (
          <Card>
            <h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border">
              {type === "list" && "Datas (opcional)"}
              {type === "challenge" && "Meta e período"}
              {type === "subscription" && "Assinatura"}
              {type === "wishlist" && "Datas (opcional)"}
            </h2>

            {type === "list" && (
              <>
                <p className="text-sm italic text-ink-fade mb-4">
                  Use pra listas com prazo (ex: &quot;Ler em janeiro&quot;).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Início"
                    name="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    errorText={fieldErrors.start_date}
                  />
                  <Input
                    label="Fim"
                    name="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    errorText={fieldErrors.end_date}
                  />
                </div>
              </>
            )}

            {type === "wishlist" && (
              <>
                <p className="text-sm italic text-ink-fade mb-4">
                  Use pra agrupar livros que você quer comprar (ex:
                  &quot;Black Friday&quot;, &quot;Aniversário&quot;).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Início"
                    name="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    errorText={fieldErrors.start_date}
                  />
                  <Input
                    label="Data limite pra comprar"
                    name="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    errorText={fieldErrors.end_date}
                  />
                </div>
              </>
            )}

            {type === "challenge" && (
              <div className="space-y-4">
                <Input
                  label="Meta de livros"
                  name="goal_count"
                  type="number"
                  min={1}
                  required
                  value={goalCount}
                  onChange={(e) => setGoalCount(e.target.value)}
                  errorText={fieldErrors.goal_count}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Início"
                    name="start_date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    errorText={fieldErrors.start_date}
                  />
                  <Input
                    label="Fim"
                    name="end_date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    errorText={fieldErrors.end_date}
                  />
                </div>
              </div>
            )}

            {type === "subscription" && (
              <div className="space-y-4">
                <Input
                  label="Provedor"
                  name="provider"
                  required
                  placeholder="TAG, PerSe, etc."
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  errorText={fieldErrors.provider}
                />
                <Input
                  label="Comecei a assinar em"
                  name="start_date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  errorText={fieldErrors.start_date}
                />
              </div>
            )}
          </Card>
        )}

        {/* Card 3 — Preview de datas raw */}
        {datesPreview && (
          <p className="text-sm italic text-ink-fade px-2">
            Datas: {datesPreview}
          </p>
        )}

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
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={!!dateError}
          >
            Criar coleção
          </Button>
        </div>
      </form>
    </div>
  );
}
