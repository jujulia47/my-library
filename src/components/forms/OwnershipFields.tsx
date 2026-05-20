"use client";

import { useEffect, useState } from "react";
import {
  Select,
  Input,
  PurchaseGroupSelect,
  type PurchaseGroupOption,
} from "@/components/ui";
import {
  OWNERSHIP_STATUS_OPTIONS_PHYSICAL,
  PURCHASE_ORIGIN_OPTIONS,
  STATUSES_WITH_PURCHASE_ORIGIN,
  STATUSES_WITH_BORROWED_FROM,
  STATUSES_WITH_LENT_TO,
  STATUSES_WITH_ACQUIRED_AT,
  STATUSES_WITH_BORROWED_AT,
  eventDateForStatus,
  eventDateForTransition,
} from "@/utils/labels";
import {
  SubscriptionSelect,
  type SubscriptionOption,
} from "./SubscriptionSelect";
import type { Database } from "@/utils/typings/supabase";

type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type PurchaseOrigin = Database["public"]["Enums"]["purchase_origin"];

export type OwnershipInitialValues = {
  ownership_status: OwnershipStatus;
  purchase_origin: PurchaseOrigin | null;
  purchase_price: number | null;
  acquired_at: string | null;
  lent_out_at: string | null;
  borrowed_at: string | null;
  returned_at: string | null;
  returned_to_acervo_at: string | null;
  disposed_date: string | null;
  borrowed_from: string | null;
  lent_to: string | null;
  subscription_id: string | null;
  purchase_group: PurchaseGroupOption | null;
};

export type FormatsState = {
  physical: boolean;
  ebook: boolean;
  audiobook: boolean;
};

export type OwnershipFieldsProps = {
  initial: OwnershipInitialValues;
  /** Lista de assinaturas pra popular o SubscriptionSelect (do server). */
  subscriptions: SubscriptionOption[];
  /** Erros do form, indexados pelo `name` do campo. */
  fieldErrors?: Record<string, string>;
  /**
   * Formatos atualmente marcados no form. Define quais opções aparecem no
   * "Estado físico":
   *   - `physical` checked → opções tradicionais (Em casa / Emprestei / etc.)
   *   - só `ebook`         → opção única "Kindle"
   *   - só `audiobook`     → opção única "Audible"
   *   - `ebook` + `audiobook` (sem físico) → ambas
   *   - nenhum formato     → seletor escondido, valor fixo "owned" via hidden
   */
  formats: FormatsState;
};

/**
 * Converte `timestamptz`/`date` ISO do banco pra `YYYY-MM-DD` consumível por
 * `<input type="date">`. Aceita string vazia/null como vazio.
 */
function toDateInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

const TERMINAL_STATES: OwnershipStatus[] = [
  "donated",
  "sold",
  "traded",
  "lost",
];

/**
 * Form section "Posse" — estado físico + origem + datas de evento (sessão
 * 17.2.6). Estado atual é comparado ao estado inicial (persistido) pra
 * detectar transições especiais como `lent_out → owned` (volta pro acervo),
 * que mostra um campo extra `returned_to_acervo_at`.
 *
 * Cada estado tem seu(s) campo(s) de data dedicado(s), com label dinâmico
 * via `eventDateForStatus`. A action consome esses campos pra:
 *   1. atualizar `book.{event_field}` apropriado;
 *   2. inserir entry em `book_status_history` com `changed_at = data do evento`.
 *
 * Persistência: campos invisíveis ficam no state local (recovery se user
 * volta pro estado), mas a action só persiste os relevantes.
 */
/**
 * Calcula quais valores de `ownership_status` fazem sentido dado o conjunto
 * de formatos marcados. Físico tem precedência: se o usuário marcou físico,
 * mesmo que também tenha ebook/audiobook, mostramos opções físicas (o estado
 * mais informativo). Caso contrário, mapeamos cada formato digital pra sua
 * plataforma padrão.
 */
function availableStatusesForFormats(formats: FormatsState): OwnershipStatus[] {
  if (formats.physical) {
    return OWNERSHIP_STATUS_OPTIONS_PHYSICAL.map((o) => o.value);
  }
  const out: OwnershipStatus[] = [];
  if (formats.ebook) out.push("kindle");
  if (formats.audiobook) out.push("audible");
  return out;
}

export function OwnershipFields({
  initial,
  subscriptions,
  fieldErrors = {},
  formats,
}: OwnershipFieldsProps) {
  // `previousStatus` é o estado persistido (não muda durante edição).
  const previousStatus = initial.ownership_status;

  const [status, setStatus] = useState<OwnershipStatus>(previousStatus);

  // Quando o usuário muda formatos, o status atual pode deixar de ser válido
  // (ex.: tira físico → "lent_out" não cabe; só ebook → defaulta pra "kindle").
  // Esse efeito reconcilia: se status atual já está na lista, mantém;
  // senão, troca pro primeiro disponível.
  const available = availableStatusesForFormats(formats);
  useEffect(() => {
    if (available.length === 0) return;
    if (!available.includes(status)) {
      setStatus(available[0]);
    }
  }, [available, status]);

  // Sem formato algum → fallback silencioso pra "owned". Não deve acontecer
  // no fluxo normal (formulário exige pelo menos 1 formato) mas é defesa.
  const effectiveStatus: OwnershipStatus =
    available.length > 0
      ? available.includes(status)
        ? status
        : available[0]
      : "owned";

  // Visibilidade do seletor de "Estado físico":
  //   - 0 opções: esconde + hidden input com "owned"
  //   - 1 opção: ainda mostra (deixa explícito qual plataforma) mas sem
  //     interatividade real além do label.
  //   - 2+ opções: select normal.
  const showStatusSelect = available.length > 0;
  // Default "nao_informado" quando o livro não tem origin definido — antes
  // existia uma opção placeholder "— Não definir —" + valor "Não informado",
  // o que era redundante. Hoje, o select sempre tem um valor; a única forma
  // do user "não definir" é deixar como "Não informado".
  const [origin, setOrigin] = useState<PurchaseOrigin>(
    initial.purchase_origin ?? "nao_informado",
  );
  const [price, setPrice] = useState<string>(
    initial.purchase_price !== null ? String(initial.purchase_price) : "",
  );

  // Datas — todas em YYYY-MM-DD. Inputs do tipo date só aceitam esse formato.
  const [acquiredAt, setAcquiredAt] = useState(toDateInput(initial.acquired_at));
  const [lentOutAt, setLentOutAt] = useState(toDateInput(initial.lent_out_at));
  const [borrowedAt, setBorrowedAt] = useState(toDateInput(initial.borrowed_at));
  const [returnedAt, setReturnedAt] = useState(toDateInput(initial.returned_at));
  const [returnedToAcervoAt, setReturnedToAcervoAt] = useState(
    toDateInput(initial.returned_to_acervo_at),
  );
  const [disposedDate, setDisposedDate] = useState(
    toDateInput(initial.disposed_date),
  );

  const [borrowedFrom, setBorrowedFrom] = useState<string>(
    initial.borrowed_from ?? "",
  );
  const [lentTo, setLentTo] = useState<string>(initial.lent_to ?? "");
  const [subscriptionId, setSubscriptionId] = useState<string | null>(
    initial.subscription_id,
  );
  const [purchaseGroup, setPurchaseGroup] =
    useState<PurchaseGroupOption | null>(initial.purchase_group);

  // Quando o user troca de assinatura (ou define/edita o valor mensal de uma
  // já selecionada), o campo "Preço" é auto-preenchido com o `monthly_price`
  // da assinatura. Snapshot por livro — mudar o valor da assinatura depois
  // NÃO afeta livros já salvos, só novas seleções.
  const handleSubscriptionChange = (
    id: string | null,
    _name: string | null,
    monthlyPrice: number | null,
  ) => {
    setSubscriptionId(id);
    if (id && monthlyPrice !== null) {
      setPrice(String(monthlyPrice));
    } else if (!id) {
      setPrice("");
    }
  };

  // Quando o user seleciona/cria um grupo com `acquired_at` definido, o
  // campo "Data de aquisição" do livro herda essa data — todos os livros
  // de um box vieram no mesmo dia por definição. Mantém-se editável caso
  // o usuário queira diferenciar; mas o default elimina retrabalho.
  const handlePurchaseGroupChange = (
    group: PurchaseGroupOption | null,
  ) => {
    setPurchaseGroup(group);
    if (group?.acquired_at) {
      setAcquiredAt(toDateInput(group.acquired_at));
    }
  };

  // === Visibilidade derivada do estado efetivo ===
  const showOrigin = STATUSES_WITH_PURCHASE_ORIGIN.includes(effectiveStatus);
  const showBorrowedFrom = STATUSES_WITH_BORROWED_FROM.includes(effectiveStatus);
  const showLentTo = STATUSES_WITH_LENT_TO.includes(effectiveStatus);
  const showSubscription = showOrigin && origin === "assinatura";
  const showPurchaseGroup = showOrigin && origin === "compra";
  // Preço é sempre opcional (compra ou assinatura) — usuário pode não
  // lembrar/querer registrar o valor, e o sistema não depende dele.
  // Quando o livro está vinculado a um grupo de compra (box), o preço é
  // calculado automaticamente pela divisão do total — o campo manual some.
  const showPrice =
    showOrigin &&
    (origin === "compra" || origin === "assinatura") &&
    !purchaseGroup;

  const showAcquiredAt = STATUSES_WITH_ACQUIRED_AT.includes(effectiveStatus);
  const showLentOutAt = effectiveStatus === "lent_out";
  const showBorrowedAt = STATUSES_WITH_BORROWED_AT.includes(effectiveStatus);
  const showReturnedAt = effectiveStatus === "returned";
  const showDisposedDate = TERMINAL_STATES.includes(effectiveStatus);

  // Transição especial: lent_out → owned ("voltou pro acervo"). Só faz
  // sentido em livros físicos.
  const transition = eventDateForTransition(previousStatus, effectiveStatus);
  const showReturnedToAcervoAt = formats.physical && transition !== null;

  // Label do `disposed_date` muda por estado — pega via helper.
  const disposedConfig = showDisposedDate
    ? eventDateForStatus(effectiveStatus)
    : null;

  // Mapa nome → label pra renderizar os <option> (cobre tanto opções físicas
  // quanto kindle/audible — todos vivem em OWNERSHIP_STATUS_OPTIONS).
  const labelFor = (value: OwnershipStatus): string => {
    const opt = OWNERSHIP_STATUS_OPTIONS_PHYSICAL.find(
      (o) => o.value === value,
    );
    if (opt) return opt.label;
    if (value === "kindle") return "Kindle";
    if (value === "audible") return "Audible";
    return value;
  };

  const helperText = formats.physical
    ? "Onde está esse livro hoje? (Define o que aparece nos próximos campos.)"
    : "Plataforma onde o arquivo digital vive.";

  return (
    <div className="space-y-5">
      {showStatusSelect ? (
        <Select
          label="Status do exemplar"
          name="ownership_status"
          value={effectiveStatus}
          onChange={(e) => setStatus(e.target.value as OwnershipStatus)}
          helperText={helperText}
        >
          {available.map((value) => (
            <option key={value} value={value}>
              {labelFor(value)}
            </option>
          ))}
        </Select>
      ) : (
        // Sem nenhum formato marcado: action ainda espera o campo; valor neutro.
        <input type="hidden" name="ownership_status" value="owned" />
      )}

      {showBorrowedFrom && (
        <Input
          label={
            status === "borrowed"
              ? "De quem peguei emprestado"
              : "Era emprestado de quem"
          }
          name="borrowed_from"
          required={status === "borrowed"}
          value={borrowedFrom}
          onChange={(e) => setBorrowedFrom(e.target.value)}
          placeholder="Ex.: Maria, Biblioteca Mário de Andrade"
          errorText={fieldErrors.borrowed_from}
        />
      )}

      {showLentTo && (
        <Input
          label="Pra quem emprestei"
          name="lent_to"
          value={lentTo}
          onChange={(e) => setLentTo(e.target.value)}
          placeholder="Opcional"
          errorText={fieldErrors.lent_to}
        />
      )}

      {/* === Datas de evento de empréstimo (borrowed/returned) === */}
      {(showBorrowedAt || showReturnedAt) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {showBorrowedAt && (
            <Input
              label="Data de início do empréstimo (opcional)"
              name="borrowed_at"
              type="date"
              value={borrowedAt}
              onChange={(e) => setBorrowedAt(e.target.value)}
              errorText={fieldErrors.borrowed_at}
            />
          )}
          {showReturnedAt && (
            <Input
              label="Data de devolução (opcional)"
              name="returned_at"
              type="date"
              value={returnedAt}
              onChange={(e) => setReturnedAt(e.target.value)}
              errorText={fieldErrors.returned_at}
            />
          )}
        </div>
      )}

      {/* === Origem + preço + datas de aquisição (estados com posse) === */}
      {showOrigin && (
        <div className="rounded-md border border-border bg-paper/40 p-4 space-y-4">
          <Select
            label="Origem da aquisição"
            name="purchase_origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value as PurchaseOrigin)}
            helperText="Como o livro entrou no acervo."
          >
            {PURCHASE_ORIGIN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          {/* Assinatura/Box vêm ANTES de preço+data porque selecionar essas
              opções auto-preenche os campos abaixo (monthly_price → preço,
              box.acquired_at → data). Faz mais sentido o user definir esses
              campos contextuais primeiro e ver o preenchimento automático. */}
          {showSubscription && (
            <SubscriptionSelect
              value={subscriptionId}
              onChange={handleSubscriptionChange}
              initialOptions={subscriptions}
              helperText="Qual assinatura trouxe esse livro. O valor mensal preenche o preço automaticamente."
              required
              errorText={fieldErrors.subscription_id}
            />
          )}

          {showPurchaseGroup && (
            <PurchaseGroupSelect
              label="Box / kit (opcional)"
              value={purchaseGroup}
              onChange={handlePurchaseGroupChange}
              hiddenFieldName="purchase_group_id"
              helperText="Se esse livro veio em um box, vincule aqui. O preço individual será calculado dividindo o total pelos livros do grupo; a data de aquisição vai herdar a data do box."
            />
          )}

          {purchaseGroup && (
            <div className="rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-sm">
              <p className="text-ink-deep">
                Preço calculado pela divisão do total do box{" "}
                <span className="italic font-medium">{purchaseGroup.name}</span>
                {" "}entre os livros vinculados. Para alterar o total, edite o
                grupo diretamente.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showPrice && (
              <Input
                label="Preço (opcional, R$)"
                name="purchase_price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex.: 45.90"
                errorText={fieldErrors.purchase_price}
              />
            )}

            {showAcquiredAt && (
              <Input
                label="Data de aquisição"
                name="acquired_at"
                type="date"
                value={acquiredAt}
                onChange={(e) => setAcquiredAt(e.target.value)}
                errorText={fieldErrors.acquired_at}
              />
            )}
          </div>

          {/* Datas de evento de saída (donated/sold/traded/lost) ou
              empréstimo pra fora (lent_out) — ficam dentro do bloco de
              origem porque conceitualmente estão ligadas ao livro "que era
              meu". */}
          {(showLentOutAt || showDisposedDate) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showLentOutAt && (
                <Input
                  label="Data em que emprestou"
                  name="lent_out_at"
                  type="date"
                  value={lentOutAt}
                  onChange={(e) => setLentOutAt(e.target.value)}
                  errorText={fieldErrors.lent_out_at}
                />
              )}
              {showDisposedDate && disposedConfig && (
                <Input
                  label={`${disposedConfig.label} (opcional)`}
                  name="disposed_date"
                  type="date"
                  value={disposedDate}
                  onChange={(e) => setDisposedDate(e.target.value)}
                  errorText={fieldErrors.disposed_date}
                />
              )}
            </div>
          )}

          {/* Transição lent_out → owned: campo dedicado pra "voltou
              pro acervo". `acquired_at` mantém valor antigo (acima). */}
          {showReturnedToAcervoAt && transition && (
            <Input
              label={`${transition.label} (opcional)`}
              name="returned_to_acervo_at"
              type="date"
              value={returnedToAcervoAt}
              onChange={(e) => setReturnedToAcervoAt(e.target.value)}
              errorText={fieldErrors.returned_to_acervo_at}
              helperText="Captura quando o livro emprestado voltou — não regrava acquired_at."
            />
          )}
        </div>
      )}
    </div>
  );
}
