-- Meta vencida NÃO transborda sozinha: o usuário clica em "replanejar" e o
-- restante vai só pra meta seguinte. Este flag registra esse clique.
alter table public.reading_target
  add column carried_over boolean not null default false;
