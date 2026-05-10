-- ============================================================================
-- Migration: serie_review
-- Adiciona coluna `review` à tabela `serie`. Mesma semântica de `reading.review`
-- e `book.comments`: texto livre opcional. Exibido no form/detail apenas quando
-- a série está em status `finished` ou `abandoned`.
-- ============================================================================

alter table public.serie add column if not exists review text;
