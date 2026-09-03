-- ============================================================================
-- Migration: book_publication_era
-- Campo de texto livre pra datas de publicação imprecisas/antigas que um ano
-- numérico não representa: "Século X a.C.", "c. 800 a.C.", etc. Quando
-- preenchido, é ele que aparece; `publication_year` (número) segue opcional,
-- alimentando os gráficos por década/ano.
-- ============================================================================

alter table public.book
  add column if not exists publication_era text;
