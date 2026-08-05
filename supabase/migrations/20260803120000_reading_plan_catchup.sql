-- "Diluir o atraso": quando a capacidade não cobre o plano do mês, o usuário
-- pode espalhar o déficit (páginas atrás do ritmo) até uma data escolhida,
-- lendo X páginas a mais por dia. Guarda a data limite por mês; o "X/dia" é
-- derivado ao vivo (déficit ÷ dias até a data).
create table public.reading_plan_catchup (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_month date not null,
  spread_until date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_month)
);

comment on table public.reading_plan_catchup is
  'Diluição do atraso do plano por mês: espalha o déficit de capacidade até '
  'spread_until (X páginas a mais/dia, derivado). Uma linha por user por mês.';

alter table public.reading_plan_catchup enable row level security;

create policy "reading_plan_catchup_select_own" on public.reading_plan_catchup
  for select using (auth.uid() = user_id);
create policy "reading_plan_catchup_insert_own" on public.reading_plan_catchup
  for insert with check (auth.uid() = user_id);
create policy "reading_plan_catchup_update_own" on public.reading_plan_catchup
  for update using (auth.uid() = user_id);
create policy "reading_plan_catchup_delete_own" on public.reading_plan_catchup
  for delete using (auth.uid() = user_id);
