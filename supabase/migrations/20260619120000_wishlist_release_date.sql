-- Data de lançamento opcional pra wishlist — usado pra livros em pré-venda
-- ou aguardando publicação. Nullable: a maioria dos itens da wishlist não
-- precisa (livros que já existem no mercado).
alter table public.wishlist
  add column release_date date;

comment on column public.wishlist.release_date is
  'Data de lançamento prevista do livro. Usado pra itens em pré-venda ou '
  'lançamentos futuros. Null = livro já lançado ou data desconhecida.';
