-- ============================================================================
-- Migration: serie_status_auto
-- O status da série passa a ser DERIVADO automaticamente do status de leitura
-- dos seus livros (antes era manual). Regras, por precedência:
--   1) algum livro com leitura 'reading'          → série 'reading'
--   2) senão, TODOS os livros (cadastrados) lidos  → série 'finished'
--   3) senão, nenhum livro lido (tudo tbr)         → série 'tbr'
--   4) senão (algum lido, nenhum lendo agora)      → série 'paused'
--
-- "TODOS os livros" = todos os livros CADASTRADOS na série (book.serie_id).
-- Um livro conta como 'lido' se tem qualquer reading 'finished', e como
-- 'lendo' se tem qualquer reading 'reading'.
--
-- Exceção: se a série está 'abandoned' (abandono manual e deliberado), o
-- recomputo NÃO a sobrescreve — só volta a derivar se você tirar o abandono.
--
-- Implementado via triggers em `reading` (mudança de status) e `book` (livro
-- entra/sai da série), chamando uma função de recomputo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Função de recomputo do status de uma série
-- ----------------------------------------------------------------------------
create or replace function public.recompute_serie_status(p_serie uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_current  public.serie_status;
  v_total    int;
  v_reading  int;
  v_finished int;
  v_new      public.serie_status;
begin
  if p_serie is null then
    return;
  end if;

  -- Abandono é um ato manual e deliberado — não sobrescreve automaticamente.
  select status into v_current from public.serie where id = p_serie;
  if v_current = 'abandoned' then
    return;
  end if;

  select count(*) into v_total
  from public.book
  where serie_id = p_serie;

  -- Série sem livros cadastrados: não mexe no status.
  if v_total = 0 then
    return;
  end if;

  select count(*) into v_reading
  from public.book b
  where b.serie_id = p_serie
    and exists (
      select 1 from public.reading r
      where r.book_id = b.id and r.status = 'reading'
    );

  select count(*) into v_finished
  from public.book b
  where b.serie_id = p_serie
    and exists (
      select 1 from public.reading r
      where r.book_id = b.id and r.status = 'finished'
    );

  if v_reading > 0 then
    v_new := 'reading';
  elsif v_finished = v_total then
    v_new := 'finished';
  elsif v_finished > 0 then
    v_new := 'paused';
  else
    v_new := 'tbr';
  end if;

  update public.serie
  set status = v_new
  where id = p_serie
    and status is distinct from v_new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Trigger em `reading` — recomputa a série do livro afetado
-- ----------------------------------------------------------------------------
create or replace function public.trg_reading_serie_sync()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_serie uuid;
begin
  select serie_id into v_serie
  from public.book
  where id = coalesce(NEW.book_id, OLD.book_id);

  perform public.recompute_serie_status(v_serie);
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists reading_serie_sync on public.reading;
create trigger reading_serie_sync
  after insert or delete or update of status on public.reading
  for each row execute function public.trg_reading_serie_sync();

-- ----------------------------------------------------------------------------
-- 3. Trigger em `book` — livro entra/sai de uma série
-- ----------------------------------------------------------------------------
create or replace function public.trg_book_serie_sync()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' then
    if NEW.serie_id is distinct from OLD.serie_id then
      perform public.recompute_serie_status(OLD.serie_id);
      perform public.recompute_serie_status(NEW.serie_id);
    end if;
  elsif TG_OP = 'INSERT' then
    perform public.recompute_serie_status(NEW.serie_id);
  elsif TG_OP = 'DELETE' then
    perform public.recompute_serie_status(OLD.serie_id);
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists book_serie_sync on public.book;
create trigger book_serie_sync
  after insert or delete or update of serie_id on public.book
  for each row execute function public.trg_book_serie_sync();

-- ----------------------------------------------------------------------------
-- 4. Backfill — recomputa todas as séries existentes uma vez
-- ----------------------------------------------------------------------------
do $$
declare
  s record;
begin
  for s in select id from public.serie loop
    perform public.recompute_serie_status(s.id);
  end loop;
end;
$$;
