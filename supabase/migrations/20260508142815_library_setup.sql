-- ============================================================================
-- Migration: setup da página /library (sessão 16.1)
--
-- 1. enum `physical_status` (em_casa/emprestado/doado/vendido/descartado)
-- 2. tabela `shelf` (estantes do user) com RLS padrão
-- 3. book.physical_status, book.shelf_id, book.shelf_position
-- 4. Backfill: cria 3 estantes pra users que tem livro físico, distribui
--    todos os físicos na primeira (ordering=0).
--
-- Nota: o spec usava `'físico' = any(formats_owned)`, mas o enum real é
-- `book_format = physical|ebook|audiobook` (em inglês). Corrigido.
-- ============================================================================

-- 1. Enum de status físico
do $$ begin
  create type public.physical_status as enum (
    'em_casa', 'emprestado', 'doado', 'vendido', 'descartado'
  );
exception when duplicate_object then null; end $$;

-- 2. Tabela shelf
create table if not exists public.shelf (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ordering int not null,
  symbol text not null check (symbol in (
    'moon', 'sun', 'feather', 'key', 'rose', 'crown', 'star', 'flame'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shelf_user_ordering_idx
  on public.shelf(user_id, ordering);

alter table public.shelf enable row level security;

create policy "shelf_select_own" on public.shelf
  for select to authenticated using (auth.uid() = user_id);
create policy "shelf_insert_own" on public.shelf
  for insert to authenticated with check (auth.uid() = user_id);
create policy "shelf_update_own" on public.shelf
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "shelf_delete_own" on public.shelf
  for delete to authenticated using (auth.uid() = user_id);

-- Trigger updated_at — reusa função set_updated_at() do init.sql
create trigger shelf_set_updated_at
  before update on public.shelf
  for each row execute function public.set_updated_at();

-- 3. Colunas em book
alter table public.book
  add column if not exists physical_status public.physical_status not null default 'em_casa',
  add column if not exists shelf_id uuid references public.shelf(id) on delete set null,
  add column if not exists shelf_position int;

create index if not exists book_user_shelf_idx
  on public.book(user_id, shelf_id, shelf_position);

-- 4. Backfill: 3 estantes pra cada user com livro físico
do $$
declare
  rec record;
begin
  for rec in (
    select distinct user_id
    from public.book
    where 'physical' = any(formats_owned)
  ) loop
    if not exists (select 1 from public.shelf where user_id = rec.user_id) then
      insert into public.shelf (user_id, ordering, symbol) values
        (rec.user_id, 0, 'moon'),
        (rec.user_id, 1, 'sun'),
        (rec.user_id, 2, 'feather');
    end if;
  end loop;
end $$;

-- Distribui físicos existentes na primeira estante. shelf_position usa
-- `row_number()` ordenado por title pra dar ordem inicial estável (em vez do
-- placeholder do spec que usava id::text::int — daria erro de cast em UUID).
with ranked as (
  select
    b.id,
    s.id as shelf_id,
    row_number() over (
      partition by b.user_id order by b.title
    ) - 1 as pos
  from public.book b
  join public.shelf s on s.user_id = b.user_id and s.ordering = 0
  where b.shelf_id is null
    and 'physical' = any(b.formats_owned)
)
update public.book b
set shelf_id = r.shelf_id, shelf_position = r.pos
from ranked r
where b.id = r.id;
