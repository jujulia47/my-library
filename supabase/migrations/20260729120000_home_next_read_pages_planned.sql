-- "Quantas páginas deste livro vou ler neste mês" — só pra livros de fila
-- (sem meta). Null = o livro todo (restante). Usado na contabilidade do total
-- de páginas do mês e no cap da projeção da fila.
alter table public.home_next_read
  add column pages_planned integer
  check (pages_planned is null or pages_planned > 0);

comment on column public.home_next_read.pages_planned is
  'Páginas planejadas deste livro no mês (fila sem meta). Null = livro todo.';
