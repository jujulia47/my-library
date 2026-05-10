import { redirect } from "next/navigation";

/**
 * /year sem ano explícito redireciona pro ano corrente. Sidebar aponta sempre
 * pra /year (estável); o redirect mantém o user no contexto certo automatic-
 * ally cada novo ano.
 */
export default function YearIndex(): never {
  const currentYear = new Date().getFullYear();
  redirect(`/year/${currentYear}`);
}
