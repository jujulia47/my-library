-- Flag explícita "quero ler" (TBR) no próprio livro.
--
-- Antes o TBR era 100% derivado: livro sem nenhum registro em `reading` (e
-- sem `wont_read`) caía em "quero ler". Isso impedia marcar um livro JÁ LIDO
-- como TBR — caso de "quero reler". Agora `is_tbr` permite uma lista de
-- leitura curada independente do histórico de leitura.
--
-- Semântica no filtro (ver bookList.ts):
--   tbr = is_tbr = true  OU  (sem reading E não wont_read)
-- Ou seja: a flag SOMA ao default derivado, não o substitui. Um livro nunca
-- lido continua aparecendo em TBR sem precisar marcar nada.
alter table public.book
  add column is_tbr boolean not null default false;

comment on column public.book.is_tbr is
  'Marca explícita de "quero ler" — entra na lista TBR independente do '
  'histórico de leitura (permite marcar livros já lidos pra reler). Soma ao '
  'TBR derivado (livro sem reading e sem wont_read).';
