-- ============================================================================
-- Migration: wishlist_slug
-- Sessão 8: adiciona slug e unique constraint pra wishlist (entrar no padrão
-- das outras entidades). URLs ficam em /wishlist/{slug} em vez de /wishlist
-- + id no querystring. O nome do unique index é explícito pra que o
-- translateSupabaseError consiga mapear via substring match.
-- ============================================================================

-- 1) Adiciona slug nullable temporariamente pra permitir backfill.
alter table public.wishlist add column if not exists slug text;

-- 2) Backfill com o id pra rows preexistentes — garante unicidade sem precisar
--    inferir slug humano. O usuário regenera o slug naturalmente ao editar
--    (sessão 6.4: slug acompanha o título).
update public.wishlist set slug = id::text where slug is null;

-- 3) Trava como NOT NULL.
alter table public.wishlist alter column slug set not null;

-- 4) Unique index com nome explícito → translateSupabaseError pega via match.
create unique index if not exists wishlist_user_slug_key
  on public.wishlist(user_id, slug);
