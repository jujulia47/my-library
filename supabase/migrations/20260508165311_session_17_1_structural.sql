-- ============================================================================
-- SESSION 17.1 — Structural changes
--
-- 1. profiles (display_name + auto-handle_new_user)
-- 2. book_status_history (auditoria de ownership_status)
-- 3. subscription (assinaturas reutilizáveis: Vitorianos, TAG)
-- 4. quote.book_id ON DELETE SET NULL (citações órfãs)
-- 5. RPCs seed_default_categories / seed_default_subscriptions (auth.uid())
-- 6. Trigger pra novos usuários (cria profile + dispara seeds)
-- 7. Backfill: profile + seeds + history pra users/livros existentes
-- ============================================================================

-- 1. profiles --------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (user_id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

-- 2. book_status_history ---------------------------------------------------

create table if not exists public.book_status_history (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.book(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.ownership_status not null,
  changed_at timestamptz not null default now(),
  notes text
);

create index if not exists book_status_history_book_idx
  on public.book_status_history(book_id, changed_at desc);

create index if not exists book_status_history_user_idx
  on public.book_status_history(user_id, changed_at desc);

alter table public.book_status_history enable row level security;

drop policy if exists "bsh_select_own" on public.book_status_history;
create policy "bsh_select_own" on public.book_status_history
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "bsh_insert_own" on public.book_status_history;
create policy "bsh_insert_own" on public.book_status_history
  for insert to authenticated with check (user_id = auth.uid());

-- (sem update/delete — histórico é append-only)

-- Trigger pra auto-registrar mudanças
create or replace function public.record_book_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.book_status_history (book_id, user_id, status, notes)
    values (new.id, new.user_id, new.ownership_status, 'criado');
  elsif (TG_OP = 'UPDATE'
    and old.ownership_status is distinct from new.ownership_status) then
    insert into public.book_status_history (book_id, user_id, status, notes)
    values (new.id, new.user_id, new.ownership_status, null);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_book_status_change on public.book;
create trigger trg_book_status_change
  after insert or update of ownership_status on public.book
  for each row execute function public.record_book_status_change();

-- Backfill: criar entry inicial pra livros existentes que ainda não têm
insert into public.book_status_history (book_id, user_id, status, changed_at, notes)
select b.id, b.user_id, b.ownership_status, b.created_at, 'backfill'
from public.book b
where not exists (
  select 1 from public.book_status_history h where h.book_id = b.id
);

-- 3. subscription ----------------------------------------------------------

create table if not exists public.subscription (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists subscription_user_name_idx
  on public.subscription(user_id, lower(name));

alter table public.subscription enable row level security;

drop policy if exists "subscription_select_own" on public.subscription;
create policy "subscription_select_own" on public.subscription
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "subscription_insert_own" on public.subscription;
create policy "subscription_insert_own" on public.subscription
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "subscription_update_own" on public.subscription;
create policy "subscription_update_own" on public.subscription
  for update to authenticated using (user_id = auth.uid());

drop policy if exists "subscription_delete_own" on public.subscription;
create policy "subscription_delete_own" on public.subscription
  for delete to authenticated using (user_id = auth.uid());

-- Adicionar referência opcional na tabela book
alter table public.book
  add column if not exists subscription_id uuid
  references public.subscription(id) on delete set null;

create index if not exists book_subscription_idx
  on public.book(subscription_id) where subscription_id is not null;

-- 4. citações órfãs: ON DELETE SET NULL -----------------------------------

alter table public.quote drop constraint if exists quote_book_id_fkey;
alter table public.quote alter column book_id drop not null;
alter table public.quote add constraint quote_book_id_fkey
  foreign key (book_id) references public.book(id) on delete set null;

-- 5. RPCs de seed ----------------------------------------------------------
-- (Substitui a versão anterior `seed_default_categories(p_user_id uuid)` por
--  uma sem parâmetro que usa `auth.uid()` — corrige o TypeError no client.)

create or replace function public.seed_default_categories_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  defaults text[] := ARRAY[
    'Fantasia',
    'Ficção científica',
    'Romance',
    'Suspense / Thriller',
    'Não-ficção',
    'Biografia',
    'Ensaios',
    'Poesia',
    'Clássicos',
    'Young Adult',
    'Contos',
    'Auto-ajuda',
    'História',
    'Quadrinhos / HQ'
  ];
  cat text;
  cat_slug text;
begin
  foreach cat in array defaults loop
    cat_slug := regexp_replace(
      lower(unaccent(cat)),
      '[^a-z0-9]+', '-', 'g'
    );
    cat_slug := regexp_replace(cat_slug, '(^-|-$)', '', 'g');
    insert into public.category (user_id, name, slug)
    values (p_user_id, cat, cat_slug)
    on conflict (user_id, slug) do nothing;
  end loop;
end;
$$;

-- Drop versões antigas (qualquer assinatura) pra evitar conflito de overload.
drop function if exists public.seed_default_categories(uuid);
drop function if exists public.seed_default_categories();

-- RPC chamável pelo frontend (sem parâmetro — usa auth.uid())
create or replace function public.seed_default_categories()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.seed_default_categories_for_user(auth.uid());
end;
$$;

grant execute on function public.seed_default_categories() to authenticated;

-- Mesma coisa para subscription (Vitorianos + TAG)
create or replace function public.seed_default_subscriptions_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  defaults text[] := ARRAY['Vitorianos', 'TAG'];
  sub text;
begin
  foreach sub in array defaults loop
    insert into public.subscription (user_id, name)
    values (p_user_id, sub)
    on conflict (user_id, lower(name)) do nothing;
  end loop;
end;
$$;

drop function if exists public.seed_default_subscriptions();

create or replace function public.seed_default_subscriptions()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.seed_default_subscriptions_for_user(auth.uid());
end;
$$;

grant execute on function public.seed_default_subscriptions() to authenticated;

-- 6. Trigger pra novos usuários -------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (user_id) do nothing;

  perform public.seed_default_categories_for_user(new.id);
  perform public.seed_default_subscriptions_for_user(new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Backfill: usuário(s) existente(s) ------------------------------------

insert into public.profiles (user_id)
select id from auth.users
where id not in (select user_id from public.profiles);

do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    perform public.seed_default_categories_for_user(u.id);
    perform public.seed_default_subscriptions_for_user(u.id);
  end loop;
end $$;
