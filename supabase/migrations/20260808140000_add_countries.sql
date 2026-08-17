-- ============================================================================
-- Migration: add_countries
-- Adiciona nacionalidades ao enum `country` (usado em author.country):
--   Venezuela, Quênia, Dinamarca, Niassalândia (nome histórico do Malawi),
--   Suíça e Jerusalém (cidade — entra sem bandeira, só o nome).
-- ADD VALUE é idempotente com IF NOT EXISTS; não usa os valores na mesma
-- transação, então roda sem problema.
-- ============================================================================

alter type public.country add value if not exists 'venezuela';
alter type public.country add value if not exists 'quenia';
alter type public.country add value if not exists 'dinamarca';
alter type public.country add value if not exists 'niassalandia';
alter type public.country add value if not exists 'suica';
alter type public.country add value if not exists 'jerusalem';
