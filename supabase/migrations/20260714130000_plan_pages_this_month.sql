-- Campo opcional "páginas que vou ler DESTE livro NESTE mês".
--
-- Uso: um livro pode transbordar pro mês seguinte (ex.: Anna Karênina que você
-- planeja terminar em agosto). Se você preenche quantas páginas pretende ler
-- só neste mês, a meta/dia e o "páginas a ler" usam esse número — descontando
-- o que vai pro mês que vem. Vazio = usa o restante do livro inteiro.
alter table public.reading_plan_book
  add column pages_this_month integer
    check (pages_this_month is null or pages_this_month >= 0);

comment on column public.reading_plan_book.pages_this_month is
  'Páginas que o usuário planeja ler deste livro neste mês. Null = usa o '
  'restante total do livro. Preenchido = desconta o que sobra pra outro mês.';
