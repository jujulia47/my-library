-- ============================================================================
-- Migration: collection rework (sessão 9.1)
-- Normaliza schema da coleção: dropa as 3 tabelas de junção legadas
-- (collection_book, collection_serie, collection_wishlist) em favor de uma
-- única collection_item polimórfica (book OR wishlist, séries saem do escopo).
-- Substitui collection.status (enum) por collection.is_archived (boolean) +
-- progresso derivado dos items. Renomeia finish_date → end_date pra alinhar
-- com a convenção start_date/end_date em datas raw da coleção.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Drop legacy junctions (dados aceitos como descartáveis em pré-prod)
-- ----------------------------------------------------------------------------
drop table if exists public.collection_book;
drop table if exists public.collection_serie;
drop table if exists public.collection_wishlist;

-- ----------------------------------------------------------------------------
-- 2. Limpeza de status enum + coluna
-- ----------------------------------------------------------------------------
alter table public.collection drop column if exists status;
drop type if exists public.collection_status;

-- ----------------------------------------------------------------------------
-- 3. Renomear finish_date → end_date e ajustar constraint de datas
-- ----------------------------------------------------------------------------
-- A constraint anônima original (named `collection_check`) usa finish_date.
-- Drop dela primeiro pra não bloquear o rename.
alter table public.collection drop constraint if exists collection_check;

alter table public.collection rename column finish_date to end_date;

alter table public.collection
  add constraint collection_check check (
    start_date is null or end_date is null or start_date <= end_date
  );

-- ----------------------------------------------------------------------------
-- 4. Novas colunas
-- ----------------------------------------------------------------------------
alter table public.collection
  add column if not exists goal_count integer
    check (goal_count is null or goal_count > 0),
  add column if not exists provider text,
  add column if not exists is_archived boolean not null default false;

create index if not exists collection_is_archived_idx
  on public.collection(is_archived);

-- ----------------------------------------------------------------------------
-- 5. collection_item — tabela polimórfica
-- Cada linha aponta pra UM book OU UM wishlist (XOR via check constraint).
-- ----------------------------------------------------------------------------
create table public.collection_item (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collection(id) on delete cascade,

  book_id uuid references public.book(id) on delete cascade,
  wishlist_id uuid references public.wishlist(id) on delete cascade,

  section text,
  position integer,
  added_at timestamptz not null default now(),

  constraint collection_item_exactly_one
    check ((book_id is null) <> (wishlist_id is null))
);

create unique index collection_item_unique_book
  on public.collection_item(collection_id, book_id)
  where book_id is not null;

create unique index collection_item_unique_wishlist
  on public.collection_item(collection_id, wishlist_id)
  where wishlist_id is not null;

create index collection_item_collection_id_idx
  on public.collection_item(collection_id);
create index collection_item_user_id_idx
  on public.collection_item(user_id);

-- ----------------------------------------------------------------------------
-- 6. RLS
-- ----------------------------------------------------------------------------
alter table public.collection_item enable row level security;

create policy "collection_item_select_own"
  on public.collection_item for select to authenticated
  using (auth.uid() = user_id);

create policy "collection_item_insert_own"
  on public.collection_item for insert to authenticated
  with check (auth.uid() = user_id);

create policy "collection_item_update_own"
  on public.collection_item for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "collection_item_delete_own"
  on public.collection_item for delete to authenticated
  using (auth.uid() = user_id);
