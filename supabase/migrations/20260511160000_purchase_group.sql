-- Suporte a aquisições em grupo (boxes, kits, combos): vários livros compram-
-- se juntos por um preço total único. O sistema divide automaticamente o
-- total entre os livros do grupo pra que `book.purchase_price` permaneça
-- representando o custo individual (e stats existentes funcionem sem mudança).
--
-- Schema:
--   - `purchase_group` armazena o grupo (nome, total, data, notas).
--   - `book.purchase_group_id` aponta pro grupo (nullable; livros standalone
--     continuam sem grupo).
--
-- Divisão: feita pela action `updateBookFull` ao linkar/desligar livro do
-- grupo. Última divisão recebe o "resto" pra evitar drift por arredondamento
-- (ex.: R$300/7 = R$42,857... → 6 books recebem R$42,86 e o 7º recebe R$42,84,
-- somando R$300,00 exato).

create table public.purchase_group (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  total_price numeric(10, 2) not null check (total_price >= 0),
  acquired_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.book
  add column if not exists purchase_group_id uuid
  references public.purchase_group(id) on delete set null;

create index if not exists idx_book_purchase_group_id
  on public.book(purchase_group_id);

create index if not exists idx_purchase_group_user_id
  on public.purchase_group(user_id);

-- RLS — mesmo padrão das outras tabelas do app: usuário só vê seus próprios.
alter table public.purchase_group enable row level security;

create policy "purchase_group_select_own"
  on public.purchase_group
  for select
  using (auth.uid() = user_id);

create policy "purchase_group_insert_own"
  on public.purchase_group
  for insert
  with check (auth.uid() = user_id);

create policy "purchase_group_update_own"
  on public.purchase_group
  for update
  using (auth.uid() = user_id);

create policy "purchase_group_delete_own"
  on public.purchase_group
  for delete
  using (auth.uid() = user_id);

comment on table public.purchase_group is
  'Aquisição em grupo (box, kit, combo): liga vários livros a um único preço total.';

comment on column public.book.purchase_group_id is
  'Quando livro veio em um box/kit, aponta pro grupo. purchase_price '
  'individual é divisão automática do total do grupo entre os livros.';
