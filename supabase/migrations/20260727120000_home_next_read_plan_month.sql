-- Plano de leitura passa a ter dimensão de MÊS. A tabela home_next_read deixa
-- de ser "curadoria da home" e vira "entradas do plano por mês": cada linha é
-- um livro planejado para um mês específico (1º dia do mês).
--
-- "Próximas leituras" da home passa a ser derivada do plano do mês atual.
alter table public.home_next_read
  add column plan_month date;

-- Backfill: linhas existentes vão pro mês corrente (fuso do app).
update public.home_next_read
  set plan_month = date_trunc(
    'month', (now() at time zone 'America/Sao_Paulo')
  )::date
  where plan_month is null;

alter table public.home_next_read
  alter column plan_month set not null;

-- Um livro pode ser planejado em meses diferentes — a unicidade agora inclui
-- o mês.
alter table public.home_next_read
  drop constraint home_next_read_user_id_book_id_key;

alter table public.home_next_read
  add constraint home_next_read_user_book_month_key
  unique (user_id, book_id, plan_month);

comment on table public.home_next_read is
  'Entradas do plano de leitura por mês. Uma linha = um livro planejado para '
  'plan_month (1º dia do mês). Position ordena a fila dentro do mês. As '
  'Próximas leituras da home derivam das linhas do mês atual.';

create index home_next_read_user_month_position_idx
  on public.home_next_read (user_id, plan_month, position);
