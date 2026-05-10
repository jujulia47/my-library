-- ============================================================================
-- Migration: search accent-insensitive (sessão 12)
-- Habilita unaccent + cria colunas geradas *_normalized em cada tabela
-- buscável. Frontend aplica a mesma normalização (NFD + strip diacríticos)
-- na query antes do ilike. Resultado: "amalia" casa "Amália" e vice-versa.
-- ============================================================================

create extension if not exists unaccent;

-- Wrapper imutável: a função `unaccent('unaccent', $1)` é só STABLE pq depende
-- do dicionário. Pra usar em coluna gerada (e em index funcional, se quiser),
-- precisa ser IMMUTABLE. Marcar manualmente é seguro pq o dicionário 'unaccent'
-- não muda em runtime (vem do extension, que é estático nesse Postgres).
create or replace function public.immutable_unaccent(text)
returns text as $$
  select unaccent('unaccent', $1);
$$ language sql immutable;

-- ----- book -----
alter table public.book
  add column if not exists title_normalized text
  generated always as (lower(public.immutable_unaccent(title))) stored;

create index if not exists book_title_normalized_idx
  on public.book(title_normalized);

-- ----- serie -----
alter table public.serie
  add column if not exists name_normalized text
  generated always as (lower(public.immutable_unaccent(name))) stored;

create index if not exists serie_name_normalized_idx
  on public.serie(name_normalized);

-- ----- author -----
alter table public.author
  add column if not exists name_normalized text
  generated always as (lower(public.immutable_unaccent(name))) stored;

create index if not exists author_name_normalized_idx
  on public.author(name_normalized);

-- ----- quote -----
alter table public.quote
  add column if not exists text_normalized text
  generated always as (lower(public.immutable_unaccent(text))) stored,
  add column if not exists author_name_normalized text
  generated always as (lower(public.immutable_unaccent(author_name))) stored;

-- ----- wishlist -----
alter table public.wishlist
  add column if not exists title_normalized text
  generated always as (lower(public.immutable_unaccent(title))) stored,
  add column if not exists author_name_normalized text
  generated always as (lower(public.immutable_unaccent(author_name))) stored;

create index if not exists wishlist_title_normalized_idx
  on public.wishlist(title_normalized);

-- ----- collection -----
alter table public.collection
  add column if not exists name_normalized text
  generated always as (lower(public.immutable_unaccent(name))) stored,
  add column if not exists description_normalized text
  generated always as (lower(public.immutable_unaccent(description))) stored,
  add column if not exists provider_normalized text
  generated always as (lower(public.immutable_unaccent(provider))) stored;

create index if not exists collection_name_normalized_idx
  on public.collection(name_normalized);
