-- Recalcular meta é MANUAL: a cota diária nunca se reajusta sozinha pra cima.
-- Quando o usuário clica em "recalcular" numa meta atrasada, gravamos o novo
-- ponto de partida (dia + página) e o cronograma passa a ser distribuído dali
-- até o prazo.
alter table public.reading_target
  add column replan_from_date date,
  add column replan_from_page integer;

comment on column public.reading_target.replan_from_date is
  'Data em que o usuário recalculou a meta. Null = cronograma original.';
comment on column public.reading_target.replan_from_page is
  'Página em que estava ao recalcular — base da redistribuição.';
