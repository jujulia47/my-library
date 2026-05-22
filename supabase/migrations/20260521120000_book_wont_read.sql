-- Novo status de leitura "não vou ler": livro que o user tem na estante mas
-- não pretende ler — diferente de `tbr` (quer ler) e dos status de leitura
-- (reading/paused/finished/abandoned, que vêm de registros em `reading`).
--
-- Modelado como flag no próprio livro em vez de valor no enum `reading_status`
-- porque é uma INTENÇÃO sobre um livro sem leitura — não uma sessão de
-- leitura. A UI deriva o status: se há leituras → status da última; senão,
-- `wont_read` true → "não vou ler", false → "tbr".

alter table public.book
  add column wont_read boolean not null default false;

comment on column public.book.wont_read is
  'Livro que o user possui mas não pretende ler. Só relevante quando o livro não tem registros em `reading` — nesse caso o status derivado vira "wont_read" em vez de "tbr".';
