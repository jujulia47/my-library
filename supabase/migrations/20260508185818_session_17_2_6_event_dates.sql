-- ============================================================================
-- SESSION 17.2.6 — Event dates + drop auto-trigger
--
-- 1. 4 colunas novas em `book` pra capturar quando cada evento aconteceu —
--    desacopla `changed_at` de `book_status_history` da hora do save (era
--    NOW() via trigger).
-- 2. Drop o trigger `trg_book_status_change` — actions assumem a respon-
--    sabilidade pelo insert. A função `record_book_status_change()` fica
--    como utilitário disponível (não usada por nenhum trigger ativo).
-- 3. Sem backfill — entries históricas em `book_status_history` ficam com a
--    `changed_at` que tinham (data de save, não evento real). User corrige
--    manualmente os que importarem.
-- ============================================================================

alter table public.book
  add column if not exists lent_out_at            timestamptz,
  add column if not exists borrowed_at            timestamptz,
  add column if not exists returned_at            timestamptz,
  add column if not exists returned_to_acervo_at  timestamptz;

drop trigger if exists trg_book_status_change on public.book;
