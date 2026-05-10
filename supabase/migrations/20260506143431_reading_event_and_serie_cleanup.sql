-- ============================================================================
-- Migration: reading_event_and_serie_cleanup
-- 1) Cria enum reading_event_type + tabela reading_event (histórico de eventos
--    de leitura — `reading` guarda só o estado atual; o histórico vive aqui).
-- 2) Remove `serie.collection_complete` e `serie.current_book_id` (este último
--    junto com sua FK e index) — o "volume atual" passa a ser derivado do
--    status dos livros na sessão 6.2.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM reading_event_type
-- ----------------------------------------------------------------------------

create type public.reading_event_type as enum (
  'started',
  'paused',
  'resumed',
  'finished',
  'abandoned'
);

-- ----------------------------------------------------------------------------
-- 2. TABELA reading_event
-- ----------------------------------------------------------------------------

create table public.reading_event (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_id uuid not null references public.reading(id) on delete cascade,
  event_type public.reading_event_type not null,
  event_date date not null,
  notes text,
  created_at timestamptz not null default now(),

  constraint reading_event_date_not_future check (event_date <= current_date)
);

create index reading_event_reading_id_idx on public.reading_event(reading_id);
create index reading_event_user_id_idx on public.reading_event(user_id);
create index reading_event_event_date_idx on public.reading_event(event_date);

-- ----------------------------------------------------------------------------
-- 3. RLS na nova tabela (mesmo padrão das outras: 4 policies por user_id)
-- ----------------------------------------------------------------------------

alter table public.reading_event enable row level security;

create policy "reading_event_select_own"
  on public.reading_event for select
  to authenticated
  using (auth.uid() = user_id);

create policy "reading_event_insert_own"
  on public.reading_event for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "reading_event_update_own"
  on public.reading_event for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reading_event_delete_own"
  on public.reading_event for delete
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. Limpeza da tabela serie
-- ----------------------------------------------------------------------------
-- current_book_id tinha FK (serie_current_book_id_fkey) e index
-- (serie_current_book_id_idx) criados na migration 0001. Postgres dropa ambos
-- em cascade quando a coluna sai, mas explicitamos pra clareza/idempotência.

alter table public.serie
  drop constraint if exists serie_current_book_id_fkey;

drop index if exists public.serie_current_book_id_idx;

alter table public.serie drop column if exists current_book_id;
alter table public.serie drop column if exists collection_complete;
