"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import type { Database } from "@/utils/typings/supabase";

type SerieStatus = Database["public"]["Enums"]["serie_status"];

const allowedStatuses: SerieStatus[] = [
  "tbr",
  "reading",
  "paused",
  "finished",
  "abandoned",
];

function pickEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : null;
}

export default async function updateSerie(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "ID da série ausente." };

  const name = (formData.get("name") as string)?.trim();
  if (!name)
    return { ok: false, message: "Nome obrigatório.", field: "name" };

  // Slug acompanha o nome: regerado server-side a cada update. Se colide com
  // outra série do mesmo user, a unique constraint dispara e
  // translateSupabaseError mapeia pra erro inline em `name`.
  const newSlug = formateTitleToSlug(name);

  const description = (formData.get("description") as string)?.trim() || null;
  const qtyRaw = formData.get("qty_volumes") as string | null;
  const qty_volumes =
    qtyRaw && qtyRaw.trim() !== "" ? Number(qtyRaw) || null : null;

  const ratingRaw = formData.get("rating") as string | null;
  const ratingRaw_n =
    ratingRaw && ratingRaw.trim() !== "" ? Number(ratingRaw) || null : null;

  const status =
    pickEnum(formData.get("status"), allowedStatuses) ?? "tbr";
  const start_date_raw = (formData.get("start_date") as string) || null;
  const finish_date_raw = (formData.get("finish_date") as string) || null;
  const review_raw = (formData.get("review") as string)?.trim() || null;

  // Aplica matriz da fase 1: limpa campos que não fazem sentido pro status.
  // Mesma matriz do client (visibleFields), só repetida pra defesa em
  // profundidade — usuário poderia preencher um campo, mudar status pra
  // tbr, e submeter sem o re-render rodar.
  const showStartDate = status !== "tbr";
  const showFinishDate = status === "finished" || status === "abandoned";
  const showRatingReview = status === "finished" || status === "abandoned";

  const start_date = showStartDate ? start_date_raw : null;
  const finish_date = showFinishDate ? finish_date_raw : null;
  const rating = showRatingReview ? ratingRaw_n : null;
  const review = showRatingReview ? review_raw : null;

  const { error } = await supabase
    .from("serie")
    .update({
      name,
      slug: newSlug,
      description,
      qty_volumes,
      rating,
      review,
      status,
      start_date,
      finish_date,
    })
    .eq("id", id);

  if (error) return { ok: false, ...translateSupabaseError(error) };

  revalidatePath("/serie");
  revalidatePath(`/serie/${newSlug}`);

  // Em sucesso: se veio com ?from= seguro, volta pra origem. Mas se `from`
  // aponta pra detail page desta mesma série (`/serie/{algumSlug}`), o slug
  // antigo já não existe — força redirect pro slug novo, evitando 404.
  const rawFrom = formData.get("from");
  if (
    typeof rawFrom === "string" &&
    rawFrom.startsWith("/") &&
    !rawFrom.startsWith("//")
  ) {
    if (rawFrom.startsWith("/serie/") && rawFrom !== "/serie") {
      redirect(`/serie/${newSlug}`);
    }
    redirect(rawFrom);
  }
  redirect(`/serie/${newSlug}`);
}
