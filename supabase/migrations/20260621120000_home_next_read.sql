-- Curadoria manual de "próximas leituras" exibida na home.
-- Substitui a derivação automática anterior (priority/series_next) por uma
-- lista que o user controla diretamente. Sem limite de itens — a UI usa
-- carrossel com slot vazio sempre no fim pra adicionar mais.
create table public.home_next_read (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.book(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

comment on table public.home_next_read is
  'Lista curada manualmente de próximas leituras planejadas, exibida na home. '
  'Um book por user por linha. Position controla a ordem visual no carrossel.';

create index home_next_read_user_position_idx
  on public.home_next_read (user_id, position);

alter table public.home_next_read enable row level security;

-- Mesmo padrão das outras tabelas user-owned: o user só vê/edita as próprias.
create policy "home_next_read_select_own" on public.home_next_read
  for select using (auth.uid() = user_id);

create policy "home_next_read_insert_own" on public.home_next_read
  for insert with check (auth.uid() = user_id);

create policy "home_next_read_update_own" on public.home_next_read
  for update using (auth.uid() = user_id);

create policy "home_next_read_delete_own" on public.home_next_read
  for delete using (auth.uid() = user_id);
