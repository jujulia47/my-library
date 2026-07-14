-- Planejamento mensal de leitura.
--
-- A página /plano (substitui /today) mostra um calendário do mês com os livros
-- de "Próximas leituras" distribuídos pelos dias. Cada livro tem um ritmo
-- próprio (podem se sobrepor). O usuário informa dois de {início, páginas/dia,
-- fim} e o app deriva o terceiro. Opcionalmente ajusta dias específicos.
--
-- Fonte da lista de livros: `home_next_read` (a mesma de Próximas leituras).
-- O mês ativo sincroniza (adiciona livros novos de home_next_read); as linhas
-- persistem pra que o relatório de fim de mês continue existindo mesmo depois
-- que o livro sai de Próximas leituras (ex.: foi concluído).

create table public.reading_plan_book (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  book_id uuid not null references public.book(id) on delete cascade,
  -- Agendamento: o usuário fornece DOIS destes; o terceiro é derivado em app.
  start_date date,
  pages_per_day integer check (pages_per_day is null or pages_per_day > 0),
  end_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month, book_id)
);

comment on table public.reading_plan_book is
  'Livro dentro do plano de leitura de um mês (year/month). Guarda o '
  'agendamento base (início + páginas/dia OU início + fim); o valor faltante é '
  'derivado em memória. A lista é semeada de home_next_read.';

create index reading_plan_book_user_month_idx
  on public.reading_plan_book (user_id, year, month, position);

-- Ajuste fino por dia: sobrescreve quantas páginas de um livro em uma data
-- específica (ex.: menos num dia corrido, mais num sábado). Ausência = usa o
-- ritmo uniforme derivado do agendamento base.
create table public.reading_plan_day_override (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_book_id uuid not null
    references public.reading_plan_book(id) on delete cascade,
  day date not null,
  pages integer not null check (pages >= 0),
  created_at timestamptz not null default now(),
  unique (plan_book_id, day)
);

comment on table public.reading_plan_day_override is
  'Sobrescrita de páginas de um livro do plano num dia específico. Null/ausente '
  '= usa o ritmo uniforme do reading_plan_book.';

create index reading_plan_day_override_book_idx
  on public.reading_plan_day_override (plan_book_id, day);

-- RLS: cada usuário só vê/edita as próprias linhas.
alter table public.reading_plan_book enable row level security;
alter table public.reading_plan_day_override enable row level security;

create policy "reading_plan_book_select_own" on public.reading_plan_book
  for select using (auth.uid() = user_id);
create policy "reading_plan_book_insert_own" on public.reading_plan_book
  for insert with check (auth.uid() = user_id);
create policy "reading_plan_book_update_own" on public.reading_plan_book
  for update using (auth.uid() = user_id);
create policy "reading_plan_book_delete_own" on public.reading_plan_book
  for delete using (auth.uid() = user_id);

create policy "reading_plan_day_override_select_own"
  on public.reading_plan_day_override
  for select using (auth.uid() = user_id);
create policy "reading_plan_day_override_insert_own"
  on public.reading_plan_day_override
  for insert with check (auth.uid() = user_id);
create policy "reading_plan_day_override_update_own"
  on public.reading_plan_day_override
  for update using (auth.uid() = user_id);
create policy "reading_plan_day_override_delete_own"
  on public.reading_plan_day_override
  for delete using (auth.uid() = user_id);
