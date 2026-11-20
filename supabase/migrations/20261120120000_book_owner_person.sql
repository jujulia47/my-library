-- Dono do livro: agora o acervo tem livros seus e de outras pessoas da casa,
-- tudo numa conta só. `person` é a lista de pessoas da casa (no escopo da sua
-- conta); `book.owner_person_id` aponta pra ela. Nulo = "Meu" (o dono da conta)
-- — todos os livros atuais continuam seus, sem migração de dados.
create table public.person (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  -- Sem nomes repetidos por conta (o seletor de dono lista por nome).
  unique (user_id, name)
);

comment on table public.person is
  'Pessoas da casa cujos livros entram no acervo da conta. O dono da conta é '
  'representado por owner_person_id nulo em book (não tem linha aqui).';

alter table public.person enable row level security;

create policy "person_select_own" on public.person
  for select using (auth.uid() = user_id);
create policy "person_insert_own" on public.person
  for insert with check (auth.uid() = user_id);
create policy "person_update_own" on public.person
  for update using (auth.uid() = user_id);
create policy "person_delete_own" on public.person
  for delete using (auth.uid() = user_id);

-- Dono do livro. Nulo = "Meu". Ao excluir a pessoa, os livros dela voltam a
-- "Meu" (set null) em vez de sumirem.
alter table public.book
  add column owner_person_id uuid references public.person(id) on delete set null;

comment on column public.book.owner_person_id is
  'Dono do livro na casa (FK person). Nulo = dono da conta ("Meu").';

-- A maioria dos livros é "Meu" (nulo); índice parcial só sobre os de terceiros.
create index book_owner_person_idx
  on public.book (owner_person_id)
  where owner_person_id is not null;
