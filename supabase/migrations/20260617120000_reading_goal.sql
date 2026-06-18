-- Meta anual de livros lidos. Uma linha por (user, ano). UI usa 50 como
-- default quando não há linha — o usuário escolhe se quer mudar e persistir.
create table public.reading_goal (
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null check (year between 1900 and 2100),
  goal_count integer not null check (goal_count between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, year)
);

comment on table public.reading_goal is
  'Meta anual de livros lidos. Uma linha por (user, ano). Default na app = 50.';

alter table public.reading_goal enable row level security;

create policy "reading_goal_select_own" on public.reading_goal
  for select using (auth.uid() = user_id);
create policy "reading_goal_insert_own" on public.reading_goal
  for insert with check (auth.uid() = user_id);
create policy "reading_goal_update_own" on public.reading_goal
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reading_goal_delete_own" on public.reading_goal
  for delete using (auth.uid() = user_id);
