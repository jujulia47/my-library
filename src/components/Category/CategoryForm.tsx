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
      router.push("/category");
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
            as="Link"
            href="/category"
            variant="ghost"
            size="sm"
            type="button"
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
