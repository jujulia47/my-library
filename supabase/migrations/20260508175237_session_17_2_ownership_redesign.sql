-- ============================================================================
-- SESSION 17.2 — Ownership redesign
--
-- 1. Adicionar colunas livres `borrowed_from`, `lent_to` em `book`.
-- 2. Mover dados: livros com `purchase_origin='biblioteca'` viram
--    `ownership_status='borrowed'` + `borrowed_from='Biblioteca'` +
--    `purchase_origin=NULL` (preserva info textual antes do enum cair).
-- 3. Recriar enum `ownership_status` com 8 valores granulares (owned,
--    lent_out, borrowed, returned, donated, sold, traded, lost). Antes:
--    (owned, disposed, lent, never_owned).
-- 4. Recriar enum `purchase_origin` sem `biblioteca`, com `troca` e
--    `nao_informado` (postgres não permite drop de valor de enum, então
--    rename+recreate é o caminho).
-- 5. Dropar `book.physical_status` e o type `physical_status` (16.1).
--    /library passa a filtrar por `ownership_status` (Fase 6 do código).
-- 6. Drop `book_status_history.notes` field 'criado' inserts pra livros
--    novos — mantemos. (Trigger continua funcionando pq usa a coluna,
--    não o type literal.)
-- ============================================================================

-- 1. Colunas livres em `book` --------------------------------------------

alter table public.book
  add column if not exists borrowed_from text,
  add column if not exists lent_to text;

-- 2. Migrar dados de `biblioteca` antes de mexer no enum -----------------

-- borrowed_from carrega o texto "Biblioteca" pra preservar info histórica.
-- A mudança em ownership_status acontece via USING no ALTER TYPE abaixo
-- (mais simples que update separado pq enum ainda não tem 'borrowed').
update public.book
set borrowed_from = 'Biblioteca'
where purchase_origin::text = 'biblioteca';

-- 3. Reescrever `ownership_status` ---------------------------------------

-- Drop trigger temporariamente (depende da coluna; impede ALTER COLUMN TYPE).
-- Recriado mais abaixo, após o alter.
drop trigger if exists trg_book_status_change on public.book;

-- Rename pra liberar o nome e poder criar novo.
alter type public.ownership_status rename to ownership_status_old;

create type public.ownership_status as enum (
  'owned',
  'lent_out',
  'borrowed',
  'returned',
  'donated',
  'sold',
  'traded',
  'lost'
);

-- Alter de book.ownership_status. USING tem acesso a outras colunas, então
-- detectamos os "ex-biblioteca" via purchase_origin (ainda é o enum antigo).
alter table public.book
  alter column ownership_status drop default;

alter table public.book
  alter column ownership_status type public.ownership_status
  using case
    when purchase_origin::text = 'biblioteca' then 'borrowed'::public.ownership_status
    when ownership_status::text = 'owned' then 'owned'::public.ownership_status
    when ownership_status::text = 'lent' then 'lent_out'::public.ownership_status
    when ownership_status::text = 'never_owned' then 'borrowed'::public.ownership_status
    when ownership_status::text = 'disposed' then 'donated'::public.ownership_status
    else 'owned'::public.ownership_status
  end;

alter table public.book
  alter column ownership_status set default 'owned';

-- Alter de book_status_history.status. Sem contexto de purchase_origin nas
-- linhas da history (foi backfilled em 17.1), `never_owned` vai pra
-- `borrowed` (best-effort: assume que era empréstimo). Se voltar a ser
-- problema, user pode editar manualmente os rows.
alter table public.book_status_history
  alter column status type public.ownership_status
  using case status::text
    when 'owned' then 'owned'::public.ownership_status
    when 'lent' then 'lent_out'::public.ownership_status
    when 'never_owned' then 'borrowed'::public.ownership_status
    when 'disposed' then 'donated'::public.ownership_status
    else 'owned'::public.ownership_status
  end;

drop type public.ownership_status_old;

-- Recriar trigger (foi dropada acima pra permitir alter type).
create trigger trg_book_status_change
  after insert or update of ownership_status on public.book
  for each row execute function public.record_book_status_change();

-- 4. Reescrever `purchase_origin` ----------------------------------------
-- Drop biblioteca (já foi migrada acima); add troca + nao_informado.
-- Note: livros com origin='biblioteca' já tiveram o valor migrado;
-- USING abaixo só precisa cuidar dos demais.

alter type public.purchase_origin rename to purchase_origin_old;

create type public.purchase_origin as enum (
  'compra',
  'assinatura',
  'presente',
  'troca',
  'outro',
  'nao_informado'
);

alter table public.book
  alter column purchase_origin type public.purchase_origin
  using case purchase_origin::text
    when 'compra' then 'compra'::public.purchase_origin
    when 'assinatura' then 'assinatura'::public.purchase_origin
    when 'presente' then 'presente'::public.purchase_origin
    when 'biblioteca' then null  -- já migrado pra ownership_status='borrowed'
    when 'outro' then 'outro'::public.purchase_origin
    else null
  end;

drop type public.purchase_origin_old;

-- 5. Drop `physical_status` (16.1) ---------------------------------------
-- /library agora filtra por ownership_status IN ('owned','lent_out').

alter table public.book drop column if exists physical_status;

drop type if exists public.physical_status;
