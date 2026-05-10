"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";

/**
 * Form action de criar série mínima. Em sucesso, redireciona pra detail
 * (ou pra `/book/new?serie_id=...` quando o usuário clicou
 * "Cadastrar e adicionar volume"). Em erro, retorna ActionResult — `field`
 * apontado pra "name" quando há colisão de slug.
 */
export default async function createSerie(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const name = (formData.get("name") as string)?.trim();
  if (!name)
    return { ok: false, message: "Nome obrigatório.", field: "name" };

  const description = (formData.get("description") as string)?.trim() || null;
  const qtyRaw = formData.get("qty_volumes") as string | null;
  const qty_volumes =
    qtyRaw && qtyRaw.trim() !== "" ? Number(qtyRaw) || null : null;

  // Slug direto. Colisão sobe via constraint serie_user_slug_key e o
  // translator mapeia pra { message, field: "name" }.
  const slug = formateTitleToSlug(name);

  const { data, error } = await supabase
    .from("serie")
    .insert({
      name,
      slug,
      description,
      qty_volumes,
      user_id: user.id,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    return { ok: false, ...translateSupabaseError(error) };
  }

  revalidatePath("/serie");

  // Botão "Cadastrar e adicionar volume" → vai pro form de livro com a série
  // pré-preenchida E `from=/serie/[slug]` pra que o BackButton e o redirect
  // pós-submit voltem pra detail da série recém-criada. Esse caminho
  // intencionalmente IGNORA o `?from=` original porque o próximo form é
  // parte do mesmo fluxo; o usuário quer ver a série completa, não voltar
  // pra origem do clique de "criar série".
  //
  // Usa URLSearchParams pra garantir encoding consistente — slashes literais
  // num query value funcionam em browser moderno mas evitamos surpresa.
  if (formData.get("and_add_book")) {
    const params = new URLSearchParams({
      serie_id: data.id,
      from: `/serie/${data.slug}`,
    });
    redirect(`/book/new?${params.toString()}`);
  }

  // Em sucesso, se veio com ?from= seguro, volta pra origem; senão, vai pra
  // detail da série recém-criada.
  const rawFrom = formData.get("from");
  if (
    typeof rawFrom === "string" &&
    rawFrom.startsWith("/") &&
    !rawFrom.startsWith("//")
  ) {
    redirect(rawFrom);
  }
  redirect(`/serie/${data.slug}`);
}
