-- ============================================================================
-- Migration: collection_item.was_wishlist (sessão 9.2)
-- Marca items que originalmente vieram da wishlist e migraram pra book quando
-- o usuário marcou como adquirido. Usado pra mostrar badge "Comprado" no card
-- de detail da coleção, preservando memória histórica.
-- ============================================================================

alter table public.collection_item
  add column if not exists was_wishlist boolean not null default false;
