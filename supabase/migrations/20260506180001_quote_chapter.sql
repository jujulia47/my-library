-- ============================================================================
-- Migration: quote_chapter
-- Sessão 7: adiciona `chapter` (text, opcional) em quote vinculada a livro.
-- Mesma ideia do `page`: só faz sentido quando há book_id; em quote avulsa
-- é ignorado.
-- ============================================================================

alter table public.quote add column if not exists chapter text;
