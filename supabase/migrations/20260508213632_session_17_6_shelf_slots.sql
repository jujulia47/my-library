-- ============================================================================
-- SESSION 17.6 — Shelf slot positions
--
-- A coluna `book.shelf_position` já existe desde 16.1 (era usada como ordem
-- linear). Aqui só garantimos com `if not exists` e adicionamos um index
-- parcial dedicado pro layout slot-based novo (filtra `shelf_id is not null`).
--
-- Sem backfill: livros existentes ficam com a `shelf_position` que tinham;
-- o renderer novo (`ShelfRow` 17.6) trata posições que apontam pra slot de
-- decoração como "unassigned" e realoca em ordem natural.
-- ============================================================================

alter table public.book
  add column if not exists shelf_position int;

create index if not exists book_shelf_position_idx
  on public.book(shelf_id, shelf_position)
  where shelf_id is not null;
