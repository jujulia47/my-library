"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { formateTitleToSlug } from "@/utils/formateTitleToSlug";
import {
  translateSupabaseError,
  type ActionResult,
} from "@/utils/translateSupabaseError";
import {
  STATUSES_WITH_PURCHASE_ORIGIN,
  STATUSES_WITH_BORROWED_FROM,
  STATUSES_WITH_LENT_TO,
  STATUSES_PHYSICALLY_HERE,
  STATUSES_WITH_ACQUIRED_AT,
  STATUSES_WITH_BORROWED_AT,
  eventDateForStatus,
  eventDateForTransition,
  type EventDateField,
} from "@/utils/labels";
import type { Database } from "@/utils/typings/supabase";

type BookFormat = Database["public"]["Enums"]["book_format"];
type BookLanguage = Database["public"]["Enums"]["book_language"];
type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type PurchaseOrigin = Database["public"]["Enums"]["purchase_origin"];

const allowedLanguages: BookLanguage[] = [
  "pt_BR",
  "en",
  "es",
  "fr",
  "it",
  "de",
  "ja",
  "other",
];

const allowedOwnership: OwnershipStatus[] = [
  "owned",
  "lent_out",
  "borrowed",
  "returned",
  "donated",
  "sold",
  "traded",
  "lost",
];

const allowedPurchaseOrigin: PurchaseOrigin[] = [
  "compra",
  "assinatura",
  "presente",
  "troca",
  "outro",
  "nao_informado",
];

const allowedFormats: BookFormat[] = ["physical", "ebook", "audiobook"];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function pickEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : null;
}

export async function updateBookFull(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "ID do livro ausente." };

  const title = (formData.get("title") as string)?.trim();
  if (!title)
    return { ok: false, message: "Título obrigatório.", field: "title" };

  const original_title =
    (formData.get("original_title") as string)?.trim() || null;
  const isbn = (formData.get("isbn") as string)?.trim() || null;
  const publisher = (formData.get("publisher") as string)?.trim() || null;
  const publicationYearRaw = formData.get("publication_year") as string | null;
  const publication_year = publicationYearRaw
    ? Number(publicationYearRaw) || null
    : null;
  const synopsis = (formData.get("synopsis") as string)?.trim() || null;
  const pagesRaw = formData.get("pages") as string | null;
  const pages = pagesRaw ? Number(pagesRaw) || null : null;
  const language = pickEnum(formData.get("language"), allowedLanguages);
  const serie_id = (formData.get("serie_id") as string) || null;
  const volumeRaw = formData.get("volume") as string | null;
  const volume = volumeRaw ? Number(volumeRaw) || null : null;

  // === Posse / Aquisição (sessão 17.2 + datas de evento na 17.2.6) ===
  // Estado físico controla quais campos são persistidos. Campos fora do
  // estado selecionado vão pra null no banco — evita lixo. Datas de evento
  // têm cada uma sua própria coluna agora (lent_out_at, borrowed_at, etc.).
  const ownership_status =
    pickEnum(formData.get("ownership_status"), allowedOwnership) ?? "owned";

  // previousStatus: vem do hidden field do form (estado quando o user abriu
  // o edit). Fallback pro DB se não veio (defesa em profundidade).
  const previousStatusRaw = formData.get(
    "previous_ownership_status",
  ) as string | null;
  const previousStatus = pickEnum(previousStatusRaw, allowedOwnership);

  const rawPurchaseOrigin = pickEnum(
    formData.get("purchase_origin"),
    allowedPurchaseOrigin,
  );
  const purchase_origin = STATUSES_WITH_PURCHASE_ORIGIN.includes(ownership_status)
    ? rawPurchaseOrigin
    : null;

  const purchasePriceRaw = (formData.get("purchase_price") as string)?.trim();
  let rawPurchasePrice: number | null = null;
  if (purchasePriceRaw) {
    const n = Number(purchasePriceRaw);
    if (Number.isFinite(n) && n >= 0) rawPurchasePrice = n;
  }
  const purchase_price =
    purchase_origin === "compra" || purchase_origin === "assinatura"
      ? rawPurchasePrice
      : null;

  const rawSubscriptionId =
    (formData.get("subscription_id") as string)?.trim() || null;
  const subscription_id =
    purchase_origin === "assinatura" ? rawSubscriptionId : null;

  // Helper pra ler campo date e validar formato YYYY-MM-DD.
  function readDate(name: string): string | null {
    const raw = (formData.get(name) as string)?.trim();
    return raw && ISO_DATE.test(raw) ? raw : null;
  }

  // === Datas de evento (sessão 17.2.6) ===
  const acquiredAtForm = readDate("acquired_at");
  const lentOutAtForm = readDate("lent_out_at");
  const borrowedAtForm = readDate("borrowed_at");
  const returnedAtForm = readDate("returned_at");
  const returnedToAcervoAtForm = readDate("returned_to_acervo_at");
  const disposedDateForm = readDate("disposed_date");

  // Detecta transição especial pra preservação semântica de acquired_at.
  const transition =
    previousStatus && previousStatus !== ownership_status
      ? eventDateForTransition(previousStatus, ownership_status)
      : null;
  const isLentToOwnedReturn =
    transition !== null && transition.field === "returned_to_acervo_at";

  // Resolução final por estado. Cada coluna do book recebe valor só quando
  // faz sentido pra estado atual; senão, null.
  const acquired_at = (() => {
    if (!STATUSES_WITH_ACQUIRED_AT.includes(ownership_status)) return null;
    // Transição lent_out → owned: NÃO regrava acquired_at — preserva valor
    // antigo do banco. Sinalizamos via undefined pra excluir do payload.
    if (isLentToOwnedReturn) return undefined;
    return acquiredAtForm;
  })();
  const lent_out_at =
    ownership_status === "lent_out" ? lentOutAtForm : null;
  const borrowed_at = STATUSES_WITH_BORROWED_AT.includes(ownership_status)
    ? borrowedAtForm
    : null;
  const returned_at = ownership_status === "returned" ? returnedAtForm : null;
  // returned_to_acervo_at: SETA na transição lent_out → owned. Em outros
  // estados, preserva valor antigo (não mexe — undefined no payload).
  const returned_to_acervo_at: string | null | undefined = isLentToOwnedReturn
    ? returnedToAcervoAtForm
    : undefined;
  const disposed_date = ["donated", "sold", "traded", "lost"].includes(
    ownership_status,
  )
    ? disposedDateForm
    : null;

  const rawBorrowedFrom =
    (formData.get("borrowed_from") as string)?.trim() || null;
  const borrowed_from = STATUSES_WITH_BORROWED_FROM.includes(ownership_status)
    ? rawBorrowedFrom
    : null;

  const rawLentTo = (formData.get("lent_to") as string)?.trim() || null;
  const lent_to = STATUSES_WITH_LENT_TO.includes(ownership_status)
    ? rawLentTo
    : null;

  // === Validações inline ===
  if (ownership_status === "borrowed" && !borrowed_from) {
    return {
      ok: false,
      message: "Informe de quem você pegou o livro emprestado.",
      field: "borrowed_from",
    };
  }
  if (ownership_status === "borrowed" && !borrowed_at) {
    return {
      ok: false,
      message: "Informe a data em que pegou emprestado.",
      field: "borrowed_at",
    };
  }
  if (ownership_status === "returned" && !returned_at) {
    return {
      ok: false,
      message: "Informe a data de devolução.",
      field: "returned_at",
    };
  }
  if (
    ["donated", "sold", "traded", "lost"].includes(ownership_status) &&
    !disposed_date
  ) {
    const stateConfig = eventDateForStatus(ownership_status);
    return {
      ok: false,
      message: stateConfig
        ? `Informe a ${stateConfig.label.toLowerCase()}.`
        : "Informe a data do evento.",
      field: "disposed_date",
    };
  }
  if (isLentToOwnedReturn && !returnedToAcervoAtForm) {
    return {
      ok: false,
      message: "Informe a data em que o livro voltou pro acervo.",
      field: "returned_to_acervo_at",
    };
  }
  if (purchase_origin === "compra" && purchase_price === null) {
    return {
      ok: false,
      message: "Informe o preço pago.",
      field: "purchase_price",
    };
  }
  if (purchase_origin === "assinatura" && !subscription_id) {
    return {
      ok: false,
      message: "Selecione qual assinatura.",
      field: "subscription_id",
    };
  }

  const formats: BookFormat[] = [];
  for (const f of allowedFormats) {
    if (formData.get(`format_${f}`) === "on") formats.push(f);
  }

  // Cover: novo upload sobrescreve; flag cover_removed=true zera cover.
  const cover = formData.get("cover") as File | null;
  const coverRemoved = formData.get("cover_removed") === "true";
  let coverPath: string | null | undefined = undefined;
  if (cover && cover.size > 0) {
    const ext = cover.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { data: coverData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, cover, { cacheControl: "3600", upsert: false });
    if (uploadError)
      return { ok: false, ...translateSupabaseError(uploadError) };
    coverPath = coverData?.path ?? null;
  } else if (coverRemoved) {
    coverPath = null;
  }

  const newSlug = formateTitleToSlug(title);

  // === shelf_id (16.1, adaptado pra ownership_status em 17.2) ===
  // Livro só ocupa estante se está fisicamente conosco (owned/lent_out).
  // Quando sai (donated/sold/etc) ou volta pra dono original (returned),
  // shelf_id vira null. Quando entra em estado "owned/lent_out" e estava
  // sem shelf, atribui à primeira estante disponível.
  const { data: currentBook } = await supabase
    .from("book")
    .select("shelf_id, formats_owned")
    .eq("id", id)
    .maybeSingle();
  const currentShelfId = currentBook?.shelf_id ?? null;
  const isPhysical = (
    formats.length ? formats : currentBook?.formats_owned ?? []
  ).includes("physical");

  let nextShelfId: string | null | undefined = undefined;
  if (!STATUSES_PHYSICALLY_HERE.includes(ownership_status)) {
    nextShelfId = null;
  } else if (!currentShelfId && isPhysical) {
    const { data: firstShelf } = await supabase
      .from("shelf")
      .select("id")
      .eq("user_id", user.id)
      .order("ordering", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (firstShelf?.id) nextShelfId = firstShelf.id;
  }

  const updateData: Database["public"]["Tables"]["book"]["Update"] = {
    title,
    slug: newSlug,
    original_title,
    isbn,
    publisher,
    publication_year,
    synopsis,
    pages,
    language,
    serie_id,
    volume,
    ownership_status,
    disposed_date,
    formats_owned: formats.length ? formats : null,
    purchase_origin,
    purchase_price,
    lent_out_at,
    borrowed_at,
    returned_at,
    borrowed_from,
    lent_to,
    subscription_id,
  };
  // acquired_at: undefined = não mexe (transição lent_out → owned preserva).
  // null/string = atualiza pra esse valor.
  if (acquired_at !== undefined) updateData.acquired_at = acquired_at;
  // returned_to_acervo_at: idem — só seta na transição lent_out → owned.
  if (returned_to_acervo_at !== undefined) {
    updateData.returned_to_acervo_at = returned_to_acervo_at;
  }
  if (coverPath !== undefined) updateData.cover = coverPath;
  if (nextShelfId !== undefined) updateData.shelf_id = nextShelfId;

  const { error: updateError } = await supabase
    .from("book")
    .update(updateData)
    .eq("id", id);
  if (updateError) return { ok: false, ...translateSupabaseError(updateError) };

  // === Sincroniza entry 'criado' do histórico (sessão 17.7, idempotente
  // na 17.9) ===
  // SEMPRE atualiza a entry 'criado' pra refletir o `acquired_at` atual.
  // A comparação anterior (`previousAcquiredAt !== form.acquired_at`)
  // falhava em casos sutis de tipo/timezone — a versão idempotente sempre
  // grava a data correta, sem depender de comparação. Ignora falha
  // silenciosa (auditoria não bloqueia o save principal).
  if (acquiredAtForm) {
    const { error: historyError } = await supabase
      .from("book_status_history")
      .update({ changed_at: `${acquiredAtForm}T12:00:00Z` })
      .eq("book_id", id)
      .eq("notes", "criado")
      .eq("status", "owned");
    if (historyError) {
      console.warn(
        "[updateBookFull] sync histórico 'criado' falhou:",
        historyError,
      );
    }
  }

  // === Insert manual em book_status_history (sessão 17.2.6) ===
  // Trigger automático foi dropado; action assume. Só insere se status mudou.
  // changed_at vem da data do evento (transition → state → fallback NOW).
  if (previousStatus && previousStatus !== ownership_status) {
    const eventDateMap: Partial<Record<EventDateField, string | null>> = {
      acquired_at: acquiredAtForm,
      lent_out_at: lentOutAtForm,
      borrowed_at: borrowedAtForm,
      returned_at: returnedAtForm,
      returned_to_acervo_at: returnedToAcervoAtForm,
      disposed_date: disposedDateForm,
    };

    const transitionConfig = transition;
    const stateConfig = eventDateForStatus(ownership_status);

    let changedAtSource: EventDateField | null = null;
    if (transitionConfig) changedAtSource = transitionConfig.field;
    else if (stateConfig) changedAtSource = stateConfig.field;

    const eventDate = changedAtSource
      ? eventDateMap[changedAtSource] ?? null
      : null;
    // Fallback NOW se a data não foi fornecida ou estado não mapeado.
    const changedAt = eventDate
      ? `${eventDate}T12:00:00Z` // Meio-dia UTC pra evitar drift de fuso
      : new Date().toISOString();

    const { error: historyError } = await supabase
      .from("book_status_history")
      .insert({
        book_id: id,
        user_id: user.id,
        status: ownership_status,
        changed_at: changedAt,
        notes: null,
      });
    if (historyError) {
      // Loga e segue — history é auditoria, não bloqueia o save principal.
      console.error("[updateBookFull] history insert failed:", historyError);
    }
  }

  // Sync book_author.
  const incomingAuthorIds = formData
    .getAll("author_ids")
    .map(String)
    .filter(Boolean);
  const { data: existingAuthors } = await supabase
    .from("book_author")
    .select("author_id")
    .eq("book_id", id);
  const existingAuthorIds = new Set(
    (existingAuthors ?? []).map((r) => r.author_id),
  );
  const incomingAuthorSet = new Set(incomingAuthorIds);
  const toAddAuthors = incomingAuthorIds.filter(
    (a) => !existingAuthorIds.has(a),
  );
  const toRemoveAuthors = [...existingAuthorIds].filter(
    (a) => !incomingAuthorSet.has(a),
  );
  if (toRemoveAuthors.length > 0) {
    await supabase
      .from("book_author")
      .delete()
      .eq("book_id", id)
      .in("author_id", toRemoveAuthors);
  }
  if (toAddAuthors.length > 0) {
    await supabase.from("book_author").insert(
      toAddAuthors.map((author_id) => ({
        book_id: id,
        author_id,
        user_id: user.id,
      })),
    );

    const bibRows = toAddAuthors.map((author_id) => ({
      user_id: user.id,
      author_id,
      title,
      publication_year,
    }));
    await supabase.from("author_bibliography").upsert(bibRows, {
      onConflict: "author_id,title_normalized",
      ignoreDuplicates: true,
    });
  }

  // Sync book_category.
  const incomingCategoryIds = formData
    .getAll("category_ids")
    .map(String)
    .filter(Boolean);
  const { data: existingCategories } = await supabase
    .from("book_category")
    .select("category_id")
    .eq("book_id", id);
  const existingCategoryIds = new Set(
    (existingCategories ?? []).map((r) => r.category_id),
  );
  const incomingCategorySet = new Set(incomingCategoryIds);
  const toAddCats = incomingCategoryIds.filter(
    (c) => !existingCategoryIds.has(c),
  );
  const toRemoveCats = [...existingCategoryIds].filter(
    (c) => !incomingCategorySet.has(c),
  );
  if (toRemoveCats.length > 0) {
    await supabase
      .from("book_category")
      .delete()
      .eq("book_id", id)
      .in("category_id", toRemoveCats);
  }
  if (toAddCats.length > 0) {
    await supabase.from("book_category").insert(
      toAddCats.map((category_id) => ({
        book_id: id,
        category_id,
        user_id: user.id,
      })),
    );
  }

  revalidatePath("/book");
  revalidatePath(`/book/${newSlug}`);
  revalidatePath("/library");

  const rawFrom = formData.get("from");
  if (
    typeof rawFrom === "string" &&
    rawFrom.startsWith("/") &&
    !rawFrom.startsWith("//")
  ) {
    if (rawFrom.startsWith("/book/") && rawFrom !== "/book") {
      redirect(`/book/${newSlug}`);
    }
    redirect(rawFrom);
  }
  redirect(`/book/${newSlug}`);
}
