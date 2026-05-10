-- ============================================================================
-- Migration: prep pra página /year (sessão 15.1)
-- 1. purchase_origin enum + book.is_favorite + dados de aquisição
-- 2. quote.is_favorite
-- 3. collection.completed_at (precisão temporal de conquistas)
-- 4. Backfill: acquired_at = created_at::date pra books existentes
-- 5. Backfill: completed_at = now() pra challenges já completos
-- ============================================================================

-- 1. Enum de origem de aquisição. `do $$ ... duplicate_object` mantém o pattern
-- usado em home_prep — execução repetida não falha.
do $$ begin
  create type public.purchase_origin as enum (
    'compra', 'assinatura', 'presente', 'biblioteca', 'outro'
  );
exception when duplicate_object then null; end $$;

-- book ganha favorito ❤️ + dados de aquisição. Todos os 3 campos de aquisição
-- são opcionais; o user pode marcar só preço, só origem, etc.
alter table public.book
  add column if not exists is_favorite boolean not null default false,
  add column if not exists purchase_origin public.purchase_origin,
  add column if not exists purchase_price numeric(10,2),
  add column if not exists acquired_at date;

-- Index parcial idêntico ao de collection.is_favorite (home_prep).
create index if not exists book_user_favorite_idx
  on public.book(user_id, is_favorite)
  where is_favorite = true;

-- 2. quote ganha favorito ⭐ (cor diferente do heart do book; ver design-system).
alter table public.quote
  add column if not exists is_favorite boolean not null default false;

create index if not exists quote_user_favorite_idx
  on public.quote(user_id, is_favorite)
  where is_favorite = true;

-- 3. collection.completed_at — precisão temporal pra "Conquistas do ano".
-- Diferente de is_completed (derivado de read_count >= goal_count em
-- collectionList.ts), completed_at é "quando bateu a meta pela primeira vez".
-- Set automaticamente em addCollectionItem e updateReading (Fase 3); o backfill
-- abaixo preenche o histórico com now() porque não temos a data exata.
alter table public.collection
  add column if not exists completed_at timestamptz;

-- 4. Backfill: acquired_at = created_at::date pra books existentes. Approximação
-- razoável — o que importa é "o livro entrou na biblioteca em 2024", não
-- precisão de minuto. Só atualiza onde já é null pra evitar reprocessar
-- migrations idempotentes.
update public.book
  set acquired_at = created_at::date
  where acquired_at is null;

-- 5. Backfill: completed_at = now() pra challenges já completos. Critério
-- replica a lógica de is_completed em collectionList.ts:
--   challenge é completo quando count(distinct books com reading status=finished
--   pertencentes à coleção) >= goal_count.
-- Aproximação aceita: a data não é a real (challenge pode ter sido completado
-- meses atrás), mas a UI da Fase 4 (achievements) precisa do campo populado
-- pra exibir histórico antigo. is null guard mantém idempotência.
update public.collection col
set completed_at = now()
where col.type = 'challenge'
  and col.goal_count is not null
  and col.completed_at is null
  and (
    select count(distinct b.id)
    from public.collection_item ci
    join public.book b on b.id = ci.book_id
    join public.reading r on r.book_id = b.id
    where ci.collection_id = col.id
      and r.user_id = col.user_id
      and r.status = 'finished'
  ) >= col.goal_count;
