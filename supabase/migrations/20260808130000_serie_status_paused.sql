-- ============================================================================
-- Migration: serie_status_paused
-- Complementa a `serie_status_auto`: agora um livro 'paused' também leva a
-- série a 'paused' (antes só um livro já lido levava). Precedência final:
--   1) algum livro 'reading'                       → série 'reading'
--   2) senão, TODOS os livros (cadastrados) lidos   → série 'finished'
--   3) senão, algum 'paused' OU algum já lido       → série 'paused'
--   4) senão (tudo tbr)                             → série 'tbr'
-- Mantém a exceção do 'abandoned' (não sobrescreve abandono manual).
--
-- Só redefine a função de recomputo (os triggers já apontam pra ela) e refaz o
-- backfill pra corrigir as séries existentes.
-- ============================================================================

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
  v_paused   int;
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

  select count(*) into v_paused
  from public.book b
  where b.serie_id = p_serie
    and exists (
      select 1 from public.reading r
      where r.book_id = b.id and r.status = 'paused'
    );

  if v_reading > 0 then
    v_new := 'reading';
  elsif v_finished = v_total then
    v_new := 'finished';
  elsif v_paused > 0 or v_finished > 0 then
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

-- Backfill — recomputa todas as séries com a regra nova.
do $$
declare
  s record;
begin
  for s in select id from public.serie loop
    perform public.recompute_serie_status(s.id);
  end loop;
end;
$$;
