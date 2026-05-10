import type { Database } from "@/utils/typings/supabase";

type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type PurchaseOrigin = Database["public"]["Enums"]["purchase_origin"];

/**
 * Tradução PT-BR pros valores do enum `ownership_status`. 8 estados granulares
 * (sessão 17.2): cobrem ciclo de vida completo do livro no acervo. As labels
 * são adjetivadas/em primeira pessoa pra ficar bem na timeline ("Doei", "Perdi"
 * — em vez de "Doado"/"Perdido" passivos).
 */
const OWNERSHIP_LABELS: Record<OwnershipStatus, string> = {
  owned: "Em casa",
  lent_out: "Emprestei",
  borrowed: "Tenho emprestado",
  returned: "Devolvi",
  donated: "Doei",
  sold: "Vendi",
  traded: "Troquei",
  lost: "Perdi",
};

export function labelForOwnershipStatus(status: OwnershipStatus): string {
  return OWNERSHIP_LABELS[status] ?? status;
}

/** Lista pra renderizar em selects/radios — preserva ordem narrativa. */
export const OWNERSHIP_STATUS_OPTIONS: {
  value: OwnershipStatus;
  label: string;
}[] = [
  { value: "owned", label: "Em casa" },
  { value: "lent_out", label: "Emprestei" },
  { value: "borrowed", label: "Tenho emprestado" },
  { value: "returned", label: "Devolvi" },
  { value: "donated", label: "Doei" },
  { value: "sold", label: "Vendi" },
  { value: "traded", label: "Troquei" },
  { value: "lost", label: "Perdi" },
];

/** Estados em que o livro **é meu** ou **era meu** — `purchase_origin` faz
 *  sentido. Pra `borrowed`/`returned`, origem deve ser null. */
export const STATUSES_WITH_PURCHASE_ORIGIN: OwnershipStatus[] = [
  "owned",
  "lent_out",
  "donated",
  "sold",
  "traded",
  "lost",
];

/** Estados que mostram o filtro "borrowed_from" (de quem peguei emprestado). */
export const STATUSES_WITH_BORROWED_FROM: OwnershipStatus[] = [
  "borrowed",
  "returned",
];

/** Estados que mostram o filtro "lent_to" (pra quem emprestei). */
export const STATUSES_WITH_LENT_TO: OwnershipStatus[] = ["lent_out"];

/** Estados em que o livro está fisicamente conosco (aparece em /library). */
export const STATUSES_PHYSICALLY_HERE: OwnershipStatus[] = ["owned", "lent_out"];

// =============================================================================
// Datas de evento (sessão 17.2.6)
// =============================================================================

/** Estados em que o livro **é/foi nosso** — `acquired_at` faz sentido. */
export const STATUSES_WITH_ACQUIRED_AT: OwnershipStatus[] = [
  "owned",
  "lent_out",
  "donated",
  "sold",
  "traded",
  "lost",
];

/** Estados de empréstimo de fora — `borrowed_at` faz sentido. */
export const STATUSES_WITH_BORROWED_AT: OwnershipStatus[] = [
  "borrowed",
  "returned",
];

export type EventDateField =
  | "acquired_at"
  | "lent_out_at"
  | "borrowed_at"
  | "returned_at"
  | "returned_to_acervo_at"
  | "disposed_date";

/**
 * Config padrão do campo de data pra um estado. Usado pra:
 *  - decidir qual input renderizar no form (label + name);
 *  - decidir qual data inserir como `changed_at` em book_status_history.
 *
 * Não considera contexto de transição. Pra transições especiais (ex.
 * lent_out → owned, voltou pro acervo), usar `eventDateForTransition`.
 */
export function eventDateForStatus(
  status: OwnershipStatus,
): { field: EventDateField; label: string } | null {
  switch (status) {
    case "owned":
      return { field: "acquired_at", label: "Data de aquisição" };
    case "lent_out":
      return { field: "lent_out_at", label: "Data em que emprestou" };
    case "borrowed":
      return { field: "borrowed_at", label: "Data de início do empréstimo" };
    case "returned":
      return { field: "returned_at", label: "Data de devolução" };
    case "donated":
      return { field: "disposed_date", label: "Data em que doou" };
    case "sold":
      return { field: "disposed_date", label: "Data da venda" };
    case "traded":
      return { field: "disposed_date", label: "Data da troca" };
    case "lost":
      return { field: "disposed_date", label: "Data em que perdeu" };
    default:
      return null;
  }
}

/**
 * Transições especiais que precisam de campo dedicado (não a data padrão do
 * estado destino).
 *
 * Hoje: `lent_out → owned` ("voltou pro acervo"). O destino é `owned` mas
 * NÃO é nova aquisição — `acquired_at` mantém valor antigo, e
 * `returned_to_acervo_at` captura o evento real.
 */
export function eventDateForTransition(
  from: OwnershipStatus,
  to: OwnershipStatus,
): { field: EventDateField; label: string } | null {
  if (from === "lent_out" && to === "owned") {
    return {
      field: "returned_to_acervo_at",
      label: "Data em que voltou pro acervo",
    };
  }
  return null;
}

const PURCHASE_ORIGIN_LABELS: Record<PurchaseOrigin, string> = {
  compra: "Compra",
  assinatura: "Assinatura",
  presente: "Presente",
  troca: "Troca",
  outro: "Outro",
  nao_informado: "Não informado",
};

export function labelForPurchaseOrigin(origin: PurchaseOrigin): string {
  return PURCHASE_ORIGIN_LABELS[origin] ?? origin;
}

export const PURCHASE_ORIGIN_OPTIONS: {
  value: PurchaseOrigin;
  label: string;
}[] = [
  { value: "compra", label: "Compra" },
  { value: "assinatura", label: "Assinatura" },
  { value: "presente", label: "Presente" },
  { value: "troca", label: "Troca" },
  { value: "outro", label: "Outro" },
  { value: "nao_informado", label: "Não informado" },
];
