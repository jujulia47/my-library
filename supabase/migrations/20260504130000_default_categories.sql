-- ============================================================================
-- Migration 20260504130000_default_categories.sql
-- Função para popular categorias padrão por usuário (categorias têm RLS por
-- user_id, então não dá para inserir global; cada usuário chama a RPC).
-- ============================================================================

create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.category (user_id, name, slug)
  values
    (p_user_id, 'Romance', 'romance'),
    (p_user_id, 'Fantasia', 'fantasia'),
    (p_user_id, 'Ficção científica', 'ficcao-cientifica'),
    (p_user_id, 'Suspense', 'suspense'),
    (p_user_id, 'Terror', 'terror'),
    (p_user_id, 'Mistério', 'misterio'),
    (p_user_id, 'Distopia', 'distopia'),
    (p_user_id, 'Romance histórico', 'romance-historico'),
    (p_user_id, 'HQ', 'hq'),
    (p_user_id, 'Infantojuvenil', 'infantojuvenil'),
    (p_user_id, 'Clássico', 'classico'),
    (p_user_id, 'Contos', 'contos'),
    (p_user_id, 'Romance de época', 'romance-de-epoca'),
    (p_user_id, 'Romantasia', 'romantasia'),
    (p_user_id, 'Romance policial', 'romance-policial')
  on conflict (user_id, slug) do nothing;
end;
$$;

grant execute on function public.seed_default_categories(uuid) to authenticated;
