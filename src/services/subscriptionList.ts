import { createClient } from "@/utils/supabase/server";
import { imagesUrl } from "@/services/images";

export type SubscriptionListItem = {
  id: string;
  name: string;
  active: boolean;
  notes: string | null;
};

/**
 * Lista assinaturas do user. Default: só ativas. `includeInactive=true` traz
 * tudo (útil em /collection ou backoffice). Ordenação: ativas primeiro, depois
 * por nome.
 */
export async function listSubscriptions(
  includeInactive = false,
): Promise<SubscriptionListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("subscription")
    .select("id, name, active, notes")
    .order("active", { ascending: false })
    .order("name", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export type SubscriptionBook = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  purchase_price: number | null;
  acquired_at: string | null;
  /**
   * False quando o livro divide edição física (bundled) com outro já contado —
   * o preço dele NÃO entra no total pra não contar em dobro.
   */
  counts_price: boolean;
};

export type SubscriptionWithStats = {
  id: string;
  name: string;
  monthly_price: number | null;
  notes: string | null;
  active: boolean;
  /** Livros vinculados a essa assinatura. */
  book_count: number;
  /** Soma dos preços (snapshot) dos livros dessa assinatura. */
  total_spent: number;
  /** Livros da assinatura (pro modal). */
  books: SubscriptionBook[];
};

/**
 * Assinaturas do usuário com agregados pra página de manutenção: quantos livros
 * vieram de cada uma e o total já gasto (soma dos snapshots
 * `book.purchase_price`). Como o preço é snapshot por livro, mudar
 * `monthly_price` da assinatura não altera o histórico — o total reflete o que
 * cada livro custou de fato.
 */
export async function subscriptionsWithStats(): Promise<
  SubscriptionWithStats[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: subs }, { data: books }] = await Promise.all([
    supabase
      .from("subscription")
      .select("id, name, monthly_price, notes, active")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("book")
      .select(
        "id, slug, title, cover, subscription_id, purchase_price, acquired_at, bundled_with",
      )
      .eq("user_id", user.id)
      .not("subscription_id", "is", null)
      .order("acquired_at", { ascending: false, nullsFirst: false }),
  ]);

  type RawBook = {
    id: string;
    slug: string;
    title: string;
    cover: string | null;
    subscription_id: string | null;
    purchase_price: number | string | null;
    acquired_at: string | null;
    bundled_with: string[] | null;
  };

  // Agrupa por assinatura.
  const rawBySub = new Map<string, RawBook[]>();
  for (const b of (books ?? []) as RawBook[]) {
    if (!b.subscription_id) continue;
    const list = rawBySub.get(b.subscription_id) ?? [];
    list.push(b);
    rawBySub.set(b.subscription_id, list);
  }

  return (subs ?? []).map((s) => {
    const raw = rawBySub.get(s.id) ?? [];
    const { list, total } = buildBooksDeduped(raw);
    return {
      id: s.id,
      name: s.name,
      monthly_price: s.monthly_price !== null ? Number(s.monthly_price) : null,
      notes: s.notes,
      active: s.active,
      book_count: list.length,
      total_spent: total,
      books: list,
    };
  });
}

type RawSubBook = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  purchase_price: number | string | null;
  acquired_at: string | null;
  bundled_with: string[] | null;
};

/**
 * Monta a lista de livros com `counts_price` e o total deduplicando exemplares
 * físicos: volumes ligados por `bundled_with` (dois livros na mesma edição)
 * contam o preço UMA vez. Marca como "não conta" os demais do grupo, pra o
 * modal exibir "mesma edição" em vez do preço.
 */
function buildBooksDeduped(raw: RawSubBook[]): {
  list: SubscriptionBook[];
  total: number;
} {
  const byId = new Map(raw.map((b) => [b.id, b]));
  const priceOf = (b: RawSubBook) =>
    b.purchase_price !== null ? Number(b.purchase_price) : null;

  // Componente conexo (grupo de exemplar físico), restrito aos livros da lista.
  const groupId = new Map<string, string>();
  const seen = new Set<string>();
  for (const b of raw) {
    if (seen.has(b.id)) continue;
    const stack = [b.id];
    while (stack.length) {
      const cur = stack.pop();
      if (cur === undefined || seen.has(cur)) continue;
      seen.add(cur);
      groupId.set(cur, b.id); // rótulo do grupo = primeiro id encontrado
      for (const nb of byId.get(cur)?.bundled_with ?? []) {
        if (byId.has(nb) && !seen.has(nb)) stack.push(nb);
      }
    }
  }

  // Um representante (que "conta o preço") por grupo.
  const priceCounter = new Set<string>();
  const groupHasCounter = new Set<string>();
  for (const b of raw) {
    const gid = groupId.get(b.id)!;
    if (!groupHasCounter.has(gid)) {
      groupHasCounter.add(gid);
      priceCounter.add(b.id);
    }
  }

  let total = 0;
  const list: SubscriptionBook[] = raw.map((b) => {
    const counts = priceCounter.has(b.id);
    const price = priceOf(b);
    if (counts) total += price ?? 0;
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      cover_url: b.cover ? imagesUrl(b.cover) : null,
      purchase_price: price,
      acquired_at: b.acquired_at,
      counts_price: counts,
    };
  });

  return { list, total };
}
