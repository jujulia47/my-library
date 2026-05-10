-- ============================================================================
-- Migration: RPC pra shiftar shelf_position em massa (sessão 16.2)
--
-- Quando um livro é solto numa posição específica de uma estante, todos os
-- livros da estante com `shelf_position >= alvo` (exceto o próprio que está
-- sendo movido) precisam ser empurrados em +1 pra abrir o slot. Fazer isso
-- via N updates em série do client é caro e suscetível a race; o RPC executa
-- num único statement com a constraint de ownership inline (`auth.uid()`).
--
-- security definer + grant em authenticated permite chamar via Supabase JS
-- client (`supabase.rpc('shift_shelf_positions', { ... })`).
-- ============================================================================

create or replace function public.shift_shelf_positions(
  p_shelf_id uuid,
  p_from_position int,
  p_exclude_book_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.book
  set shelf_position = shelf_position + 1
  where shelf_id = p_shelf_id
    and shelf_position >= p_from_position
    and id <> p_exclude_book_id
    and user_id = auth.uid();
end;
$$;

grant execute on function public.shift_shelf_positions(uuid, int, uuid)
  to authenticated;
