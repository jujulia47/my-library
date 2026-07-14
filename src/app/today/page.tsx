import { redirect } from "next/navigation";

// A página "Diário de hoje" foi substituída pelo Plano de leitura mensal.
// Mantemos a rota como redirect pra não quebrar links/bookmarks antigos.
export default function TodayPage() {
  redirect("/plano");
}
