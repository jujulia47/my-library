-- ============================================================================
-- Migration: quote_standalone
-- Sessão 7: torna a quote independente de book.
--   - book_id passa a ser nullable: quando null, é "citação avulsa"
--     (Twitter, filme, podcast, etc.). Quando presente, comportamento
--     atual preservado (citação vinculada a livro do user).
--   - author_name (text, opcional): atribuição livre. Em quote vinculada
--     pode ser preenchido a partir do book.author quando vazio; em avulsa,
--     é o único caminho pra ter atribuição.
--   - source (text, opcional): fonte da citação avulsa
--     (ex: "Twitter de @autor", "Filme Interestelar", "Podcast X ep 42").
--     Ignorado em quotes vinculadas a book.
--   - note (text, opcional): anotação pessoal sobre a citação. Vale pros
--     dois tipos.
-- ============================================================================

alter table public.quote
  alter column book_id drop not null;

alter table public.quote
  add column if not exists author_name text;

alter table public.quote
  add column if not exists source text;

alter table public.quote
  add column if not exists note text;
