-- ============================================================================
-- Migration: book_isbn_normalized
-- Coluna gerada `isbn_normalized` = só dígitos (+ X do dígito verificador),
-- maiúsculo — pra buscar por ISBN com ou sem hífens/espaços. Mesmo padrão das
-- outras colunas *_normalized usadas na busca global.
-- ============================================================================

alter table public.book
  add column if not exists isbn_normalized text
  generated always as (
    nullif(regexp_replace(upper(coalesce(isbn, '')), '[^0-9X]', '', 'g'), '')
  ) stored;
