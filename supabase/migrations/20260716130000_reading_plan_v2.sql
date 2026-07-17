-- Plano de leitura v2 — modelo derivado de 3 entradas simples:
--
--  1. METAS (reading_target): "ler da página X à Y entre DD/MM e DD/MM" (ex.:
--     metas de clube de leitura). O app deriva o total e as páginas/dia.
--     Progresso vem da página atual do livro (reading.current_page) — nada de
--     registrar leitura dentro do plano. Meta concluída quando a página atual
--     alcança page_to; o restante de uma meta vencida aparece naturalmente na
--     próxima meta (restante = page_to − página atual, sempre).
--
--  2. CAPACIDADE (reading_capacity): quantas páginas/dia o usuário consegue
--     ler, por período (uma semana de feriado pode ter mais). A sobra da
--     capacidade depois das metas alimenta a fila.
--
--  3. FILA: a ordem de leitura É a home_next_read.position (Próximas
--     leituras) — nenhuma tabela nova; as duas listas ficam 100% vinculadas.

-- ============================================================================
-- Metas de leitura (intervalo de páginas com prazo)
-- ============================================================================
create table public.reading_target (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.book(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  page_from integer not null check (page_from >= 1),
  page_to integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (page_to >= page_from),
  check (end_date >= start_date)
);

comment on table public.reading_target is
  'Meta de leitura: ler da página X à Y num período (ex.: metas de clube). '
  'Progresso derivado de reading.current_page.';

create index reading_target_user_book_idx
  on public.reading_target (user_id, book_id, start_date);

alter table public.reading_target enable row level security;
create policy "reading_target_select_own" on public.reading_target
  for select using (auth.uid() = user_id);
create policy "reading_target_insert_own" on public.reading_target
  for insert with check (auth.uid() = user_id);
create policy "reading_target_update_own" on public.reading_target
  for update using (auth.uid() = user_id);
create policy "reading_target_delete_own" on public.reading_target
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Capacidade de leitura por período (páginas/dia)
-- ============================================================================
create table public.reading_capacity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  pages_per_day integer not null check (pages_per_day > 0),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

comment on table public.reading_capacity is
  'Capacidade de leitura (páginas/dia) num período. Pode haver um período '
  'largo (o mês inteiro) e períodos mais estreitos por cima (semana de '
  'feriado): na consulta, o período MAIS ESTREITO que cobre o dia vence.';

create index reading_capacity_user_idx
  on public.reading_capacity (user_id, start_date);

alter table public.reading_capacity enable row level security;
create policy "reading_capacity_select_own" on public.reading_capacity
  for select using (auth.uid() = user_id);
create policy "reading_capacity_insert_own" on public.reading_capacity
  for insert with check (auth.uid() = user_id);
create policy "reading_capacity_update_own" on public.reading_capacity
  for update using (auth.uid() = user_id);
create policy "reading_capacity_delete_own" on public.reading_capacity
  for delete using (auth.uid() = user_id);
