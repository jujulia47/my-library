"use client";

import { useState, useTransition } from "react";
import { signIn } from "./actions";
import { Input, Button } from "@/components/ui";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <Input
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      <Input
        label="Senha"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        errorText={error ?? undefined}
      />
      <Button type="submit" loading={isPending} fullWidth>
        Entrar
      </Button>
    </form>
  );
}
