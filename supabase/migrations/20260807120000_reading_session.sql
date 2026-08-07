-- Sessão de leitura: registra uma sessão real cronometrada (segundos +
-- páginas lidas) pra medir o ritmo DE VERDADE da usuária (segundos/página).
-- Esse ritmo (média móvel dos últimos dias) substitui a estimativa fixa de
-- 80s/página nas contas de tempo do plano. Só livro físico/ebook — o ritmo é
-- medido por página, então audiobook não entra.
create table public.reading_session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid references public.book(id) on delete set null,
  reading_id uuid references public.reading(id) on delete set null,
  started_at timestamptz not null default now(),
  seconds integer not null,
  pages integer not null,
  scene text,
  created_at timestamptz not null default now()
);

comment on table public.reading_session is
  'Uma sessão de leitura cronometrada (segundos + páginas). Alimenta o ritmo '
  'real (média móvel) usado nas estimativas de tempo do plano.';

create index reading_session_user_started_idx
  on public.reading_session (user_id, started_at desc);

alter table public.reading_session enable row level security;

create policy "reading_session_select_own" on public.reading_session
  for select using (auth.uid() = user_id);
create policy "reading_session_insert_own" on public.reading_session
  for insert with check (auth.uid() = user_id);
create policy "reading_session_update_own" on public.reading_session
  for update using (auth.uid() = user_id);
create policy "reading_session_delete_own" on public.reading_session
  for delete using (auth.uid() = user_id);
