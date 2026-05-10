-- ============================================================================
-- Migration: consolidação dos campos de aquisição (sessão 15.2)
--
-- Sessão 15.1 introduziu purchase_origin/purchase_price/acquired_at em
-- paralelo aos antigos acquisition_type/acquisition_date. Esta migration
-- migra os valores antigos pros novos campos onde os novos ainda estão
-- null, depois dropa os antigos + o enum.
--
-- Mapeamento decidido na sessão:
--   purchased    → compra
--   gift         → presente
--   subscription → assinatura
--   inherited    → presente   (herança = presente da família)
--   swap         → outro
--   borrowed     → biblioteca (emprestado de biblioteca/amigo)
--   other        → outro
-- ============================================================================

-- 1. Migrar acquisition_type → purchase_origin (só onde new é null)
update public.book
set
  purchase_origin = case acquisition_type
    when 'purchased' then 'compra'::public.purchase_origin
    when 'gift' then 'presente'::public.purchase_origin
    when 'subscription' then 'assinatura'::public.purchase_origin
    when 'inherited' then 'presente'::public.purchase_origin
    when 'swap' then 'outro'::public.purchase_origin
    when 'borrowed' then 'biblioteca'::public.purchase_origin
    when 'other' then 'outro'::public.purchase_origin
    else null
  end
where acquisition_type is not null
  and purchase_origin is null;

-- 2. Migrar acquisition_date → acquired_at (só onde new é null). Em 15.1 já
--    rodou o backfill `acquired_at = created_at::date`, então esse update
--    raramente bate; é defesa em profundidade pra livros que tinham
--    acquisition_date manual mais preciso que created_at.
update public.book
set acquired_at = acquisition_date
where acquisition_date is not null
  and acquired_at is null;

-- 3. Drop colunas antigas. As views/policies que dependem ficam aviadas pelo
--    Postgres no DROP COLUMN — nenhuma view/trigger neste schema referencia
--    esses campos (verificado).
alter table public.book
  drop column if exists acquisition_type,
  drop column if exists acquisition_date;

-- 4. Drop enum antigo. Conferido (grep no schema): acquisition_type só era
--    usado pela coluna recém-dropada de public.book. Seguro.
drop type if exists public.acquisition_type;
