-- Suporte a livros que compartilham exemplar físico (omnibus) e a coletâneas
-- de contos/capítulos com sumário.
--
-- `bundled_with`: array de IDs de outros livros que vieram no mesmo físico.
-- Usado quando uma edição traz dois ou mais romances completos juntos
-- (ex.: edição que inclui "Diário da Princesa" + "A Princesa sob os Refletores").
-- Cada obra continua como cadastro próprio (avaliação, leitura, série etc.
-- separadas). ISBN fica em UM dos livros do bundle — o `bundled_with` do
-- outro livro aponta de volta pra ele e documenta o compartilhamento.
-- Simetria é mantida pelo app, não há constraint no banco.
--
-- `table_of_contents`: JSON array de `{ title: string, page_start: number? }`
-- pra coletâneas de contos ou listas de capítulos especiais. Diferente de
-- bundled_with: aqui 1 cadastro = 1 livro (coletânea), e os itens são CONTEÚDO
-- (não entidades separadas com leitura/rating próprios).

alter table public.book
  add column if not exists bundled_with uuid[] not null default '{}'::uuid[];

alter table public.book
  add column if not exists table_of_contents jsonb not null default '[]'::jsonb;

comment on column public.book.bundled_with is
  'IDs de outros livros que vieram no mesmo exemplar físico (edição omnibus). '
  'Simetria mantida pela aplicação.';

comment on column public.book.table_of_contents is
  'Lista de contos/capítulos da obra: array de { title, page_start? }. '
  'Pra coletâneas de contos e edições com sumário customizado.';
