-- ============================================================================
-- Migration: prep pra home dashboard (sessão 10)
-- 1. priority_level enum + book.priority (nullable)
-- 2. collection.is_favorite + index parcial
-- 3. reading_progress_log (histórico diário de páginas)
-- ============================================================================

-- 1. Priority level (compartilhável entre book e talvez outras tabelas no futuro)
do $$ begin
  create type public.priority_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

alter table public.book
  add column if not exists priority public.priority_level;

-- 2. Collection.is_favorite (default false; index parcial em true)
alter table public.collection
  add column if not exists is_favorite boolean not null default false;

create index if not exists collection_user_favorite_idx
  on public.collection(user_id, is_favorite)
  where is_favorite = true;

-- 3. reading_progress_log (histórico de páginas lidas por dia)
create table if not exists public.reading_progress_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_id uuid not null references public.reading(id) on delete cascade,
  log_date date not null,
  pages_delta integer not null check (pages_delta > 0),
  created_at timestamptz not null default now(),

  -- Unique nomeado pra que `upsert({...}, { onConflict: 'reading_id,log_date' })`
  -- funcione com o Supabase JS client.
  constraint reading_progress_log_reading_date_key unique (reading_id, log_date)
);

create index if not exists reading_progress_log_user_date_idx
  on public.reading_progress_log(user_id, log_date desc);

create index if not exists reading_progress_log_reading_id_idx
  on public.reading_progress_log(reading_id);

-- RLS: 4 policies padrão
alter table public.reading_progress_log enable row level security;

create policy "reading_progress_log_select_own"
  on public.reading_progress_log for select to authenticated
  using (auth.uid() = user_id);

create policy "reading_progress_log_insert_own"
  on public.reading_progress_log for insert to authenticated
  with check (auth.uid() = user_id);

create policy "reading_progress_log_update_own"
  on public.reading_progress_log for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reading_progress_log_delete_own"
  on public.reading_progress_log for delete to authenticated
  using (auth.uid() = user_id);
