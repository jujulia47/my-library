"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Input,
  Textarea,
  Button,
  Card,
  BackButton,
  ConfirmDialog,
} from "@/components/ui";
import updateCollection from "@/actions/updateCollection";
import { archiveCollection } from "@/actions/archiveCollection";
import {
  ArchiveBoxArrowDownIcon,
  ArchiveBoxXMarkIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import type { Database } from "@/utils/typings/supabase";

type CollectionRow = Database["public"]["Tables"]["collection"]["Row"];
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

const BOOK_TYPES: CollectionType[] = [
  "shelf",
  "list",
  "challenge",
  "subscription",
];

/**
 * Coleções `wishlist` aceitam só items wishlist; outras só aceitam books.
 * Trocar entre os dois mundos invalida items existentes — UI dialog avisa
 * e o submit envia `clear_items=true` pra autorizar o servidor.
 */
function isIncompatibleSwitch(
  oldType: CollectionType,
  newType: CollectionType,
): boolean {
  if (oldType === newType) return false;
  if (oldType === "wishlist" && BOOK_TYPES.includes(newType)) return true;
  if (BOOK_TYPES.includes(oldType) && newType === "wishlist") return true;
  return false;
}

function safeFrom(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

type Props = {
  collection: CollectionRow;
  itemCount: number;
};

export default function CollectionFull({ collection, itemCount }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const from = safeFrom(sp.get("from"));
  const cancelHref = from ?? "/collection";

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(cancelHref);
    }
  };

  const [type, setType] = useState<CollectionType>(collection.type);
  const [pendingTypeChange, setPendingTypeChange] =
    useState<CollectionType | null>(null);
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [goalCount, setGoalCount] = useState(
    collection.goal_count !== null ? String(collection.goal_count) : "",
  );
  const [provider, setProvider] = useState(collection.provider ?? "");
  const [startDate, setStartDate] = useState(collection.start_date ?? "");
  const [endDate, setEndDate] = useState(collection.end_date ?? "");
  const [isArchived, setIsArchived] = useState(collection.is_archived);
  const [isFavorite, setIsFavorite] = useState(collection.is_favorite);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const requestTypeChange = (next: CollectionType) => {
    if (next === type) return;
    if (itemCount > 0) {
      setPendingTypeChange(next);
      return;
    }
    applyTypeChange(next);
  };

  const applyTypeChange = (next: CollectionType) => {
    setType(next);
    if (next !== "challenge") setGoalCount("");
    if (next !== "subscription") setProvider("");
    if (next === "shelf") {
      setStartDate("");
      setEndDate("");
    }
    if (next === "subscription") setEndDate("");
    setPendingTypeChange(null);
  };

  // Determinado no submit a partir do tipo final vs original.
  const wouldClearItemsOnSubmit =
    isIncompatibleSwitch(collection.type, type) && itemCount > 0;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setGenericError(null);
    const fd = new FormData(e.currentTarget);
    if (wouldClearItemsOnSubmit) fd.set("clear_items", "true");
    startTransition(async () => {
      try {
        const result = await updateCollection(fd);
        if (!result.ok) {
          if (result.field) setFieldErrors({ [result.field]: result.message });
          else setGenericError(result.message);
          return;
        }
        const target = result.data?.redirectTo ?? `/collection/${collection.slug}`;
        const slugFromTarget =
          target.split("?")[0]?.split("/").pop() ?? "";
        const slugChanged = slugFromTarget !== collection.slug;
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

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveCollection(collection.id, !isArchived);
      if (!result.ok) {
        setGenericError(result.message);
        return;
      }
      setIsArchived((v) => !v);
      router.refresh();
    });
  };

  const dateError =
    startDate && endDate && endDate < startDate
      ? "A data de fim não pode ser anterior à data de início."
      : null;

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
        <BackButton fallback={`/collection/${collection.slug}`} />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep mb-1">
        Editar coleção
      </h1>
      <p className="text-ink-fade italic mb-6">{collection.name}</p>

      <form onSubmit={onSubmit} className="space-y-6 pb-24">
        <input type="hidden" name="id" value={collection.id} />
        <input
          type="hidden"
          name="is_favorite"
          value={isFavorite ? "true" : "false"}
        />

        {/* Card 1 — Sobre */}
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
                      onChange={() => requestTypeChange(opt.value)}
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

        {/* Card 2 — Configuração específica */}
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

        {/* Footer fixo */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-ivory/95 backdrop-blur-sm border-t border-border z-30">
          <div className="max-w-3xl mx-auto px-6 py-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={
                isFavorite ? (
                  <StarSolidIcon className="w-4 h-4 text-gold" />
                ) : (
                  <StarOutlineIcon className="w-4 h-4" />
                )
              }
              onClick={() => setIsFavorite((v) => !v)}
              disabled={isPending}
              aria-pressed={isFavorite}
              title={
                isFavorite
                  ? "Desmarcar como favorita (salva ao confirmar)"
                  : "Marcar como favorita (salva ao confirmar)"
              }
            >
              {isFavorite ? "Favorita" : "Favoritar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={
                isArchived ? (
                  <ArchiveBoxXMarkIcon className="w-4 h-4" />
                ) : (
                  <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                )
              }
              onClick={handleArchive}
              disabled={isPending}
            >
              {isArchived ? "Desarquivar" : "Arquivar"}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              disabled={!!dateError}
            >
              Salvar alterações
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={pendingTypeChange !== null}
        onClose={() => setPendingTypeChange(null)}
        onConfirm={() => {
          if (pendingTypeChange) applyTypeChange(pendingTypeChange);
        }}
        title="Mudar tipo da coleção?"
        description={(() => {
          if (!pendingTypeChange) return "";
          const incompatible = isIncompatibleSwitch(
            collection.type,
            pendingTypeChange,
          );
          if (incompatible) {
            const direction =
              pendingTypeChange === "wishlist" ? "Wishlist" : "este tipo";
            return `Trocar pra ${direction} vai REMOVER os ${itemCount} ${itemCount === 1 ? "item" : "items"} desta coleção (são incompatíveis com o novo tipo). A remoção só acontece quando você salvar. Continuar?`;
          }
          return `Esta coleção tem ${itemCount} ${itemCount === 1 ? "item" : "items"}. Mudar o tipo pode descartar configurações específicas (meta, provedor, datas). Os items continuam onde estão. Deseja continuar?`;
        })()}
        confirmLabel="Mudar tipo"
        cancelLabel="Manter"
        variant={
          pendingTypeChange &&
          isIncompatibleSwitch(collection.type, pendingTypeChange)
            ? "destructive"
            : "default"
        }
      />
    </div>
  );
}
