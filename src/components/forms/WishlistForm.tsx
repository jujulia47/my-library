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
import createWishlist from "@/actions/createWishlist";
import updateWishlist from "@/actions/updateWishlist";
import type { Database } from "@/utils/typings/supabase";

type WishlistPriority = Database["public"]["Enums"]["wishlist_priority"];

function safeFrom(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

const PRIORITY_OPTIONS: {
  value: WishlistPriority | "none";
  label: string;
  activeClass: string;
}[] = [
  {
    value: "low",
    label: "Baixa",
    activeClass: "bg-ink-fade text-ivory-light border-ink-fade",
  },
  {
    value: "medium",
    label: "Média",
    activeClass: "bg-gold text-ink-deep border-gold",
  },
  {
    value: "high",
    label: "Alta",
    activeClass: "bg-burgundy text-ivory-light border-burgundy",
  },
  {
    value: "none",
    label: "Sem prioridade",
    activeClass: "bg-paper-soft text-ink-deep border-ink-soft",
  },
];

type WishlistInitial = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  purchase_link: string | null;
  estimated_price: number | null;
  priority: WishlistPriority | null;
  notes: string | null;
};

type Props =
  | { mode: "create"; initial?: undefined }
  | { mode: "edit"; initial: WishlistInitial };

export default function WishlistForm(props: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const from = safeFrom(sp.get("from"));
  const cancelHref = from ?? "/wishlist";

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(cancelHref);
    }
  };

  const initialPriority: WishlistPriority | "none" =
    props.mode === "edit" ? (props.initial.priority ?? "none") : "none";

  const [priority, setPriority] = useState<WishlistPriority | "none">(
    initialPriority,
  );
  const [linkError, setLinkError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (from) fd.set("from", from);
    setFieldErrors({});
    setGenericError(null);
    setLinkError(null);

    // Client-side validation: link format (se preenchido).
    const link = (fd.get("purchase_link") as string)?.trim();
    if (link) {
      try {
        new URL(link);
      } catch {
        setLinkError(
          "Link inválido — comece com http:// ou https://",
        );
        return;
      }
    }

    // Priority "none" → vai vazio no payload pra ficar null no banco.
    if (priority === "none") fd.delete("priority");
    else fd.set("priority", priority);

    const isEditMode = props.mode === "edit";
    const originalSlug = isEditMode ? props.initial.slug : null;
    startTransition(async () => {
      try {
        const action = isEditMode ? updateWishlist : createWishlist;
        const result = await action(fd);
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
        const slugChanged =
          isEditMode && !!originalSlug && slugFromTarget !== originalSlug;
        if (
          isEditMode &&
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

  const isEdit = props.mode === "edit";

  return (
    <div className="font-body max-w-3xl">
      <div className="mb-4">
        <BackButton fallback="/wishlist" />
      </div>
      <h1 className="font-display text-3xl font-medium text-ink-deep mb-2">
        {isEdit ? "Editar item da wishlist" : "Adicionar à wishlist"}
      </h1>
      <p className="font-body text-ink-fade italic mb-6">
        {isEdit
          ? "Atualize as informações deste desejo."
          : "Anote um livro que você quer ter ou ler."}
      </p>

      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          {isEdit && (
            <input type="hidden" name="id" value={props.initial.id} />
          )}

          <Input
            label="Título"
            name="title"
            required
            defaultValue={props.mode === "edit" ? props.initial.title : ""}
            placeholder="Ex.: Pequenas grandes coisas"
            autoFocus
            errorText={fieldErrors.title}
          />

          <Input
            label="Autor"
            name="author_name"
            defaultValue={
              props.mode === "edit"
                ? (props.initial.author_name ?? "")
                : ""
            }
            placeholder="Opcional"
          />

          <Input
            label="Link"
            name="purchase_link"
            type="url"
            defaultValue={
              props.mode === "edit"
                ? (props.initial.purchase_link ?? "")
                : ""
            }
            placeholder="https://..."
            errorText={linkError ?? undefined}
            helperText="Amazon, Estante Virtual, site da editora… opcional."
          />

          <Input
            label="Preço estimado"
            name="estimated_price"
            type="number"
            min={0}
            step={0.01}
            defaultValue={
              props.mode === "edit"
                ? (props.initial.estimated_price ?? "")
                : ""
            }
            placeholder="Ex.: 45,90"
            leftIcon={<span className="text-ink-fade">R$</span>}
            errorText={fieldErrors.estimated_price}
          />

          <fieldset className="space-y-2">
            <legend className="text-sm font-body font-medium text-ink-deep mb-2">
              Prioridade
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const checked = priority === opt.value;
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
                      name="priority_radio"
                      value={opt.value}
                      checked={checked}
                      onChange={() => setPriority(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Textarea
            label="Observação"
            name="notes"
            defaultValue={
              props.mode === "edit" ? (props.initial.notes ?? "") : ""
            }
            placeholder="Por que esse livro? Onde viu? Qualquer nota."
          />

          {genericError && (
            <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
              {genericError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {isEdit ? "Salvar alterações" : "Adicionar à wishlist"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
