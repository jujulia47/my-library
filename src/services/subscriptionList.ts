import { createClient } from "@/utils/supabase/server";

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
