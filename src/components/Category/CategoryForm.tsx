"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Card } from "@/components/ui";
import { createCategory } from "@/actions/createCategory";
import { updateCategory } from "@/actions/updateCategory";

type Props =
  | { mode: "create"; initial?: undefined }
  | { mode: "edit"; initial: { id: string; name: string } };

export default function CategoryForm(props: Props) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditMode = props.mode === "edit";

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/category");
    }
  };

  const onSubmit = (formData: FormData) => {
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      const action =
        props.mode === "create" ? createCategory : updateCategory;
      const result = await action(formData);
      if (!result.ok) {
        if (result.field) {
          setFieldErrors({ [result.field]: result.message });
        } else {
          setGenericError(result.message);
        }
        return;
      }
      // Edit: back() pra origem natural (a lista, sem o /edit no stack).
      // Create: replace pra que o /new suma do history e o user veja a lista
      // atualizada.
      if (
        isEditMode &&
        typeof window !== "undefined" &&
        window.history.length > 1
      ) {
        router.back();
      } else {
        router.replace("/category");
      }
      router.refresh();
    });
  };

  return (
    <Card>
      <form action={onSubmit} className="space-y-5">
        {props.mode === "edit" && (
          <input type="hidden" name="id" value={props.initial.id} />
        )}
        <Input
          label="Nome"
          name="name"
          required
          defaultValue={props.mode === "edit" ? props.initial.name : ""}
          placeholder="Ex.: Romance"
          errorText={fieldErrors.name}
        />
        {genericError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {genericError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isPending}>
            {props.mode === "create" ? "Criar" : "Salvar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
