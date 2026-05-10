-- ============================================================================
-- Migration: 5º tipo de coleção 'wishlist' (sessão 9.3)
-- Postgres não permite remover valores de enum — adicionar é trivial.
-- Coleções existentes não são afetadas. Validação de tipo de item por tipo
-- de coleção fica em application code (addCollectionItem.ts).
-- ============================================================================

alter type public.collection_type add value if not exists 'wishlist';
