-- Anotações do dia no reading_progress_log. Cada entrada (1 por reading,
-- por data) pode ganhar uma nota pessoal — trecho, sensação, contexto.
-- Independente de `reading.review` (que é o "resumo final" da leitura).
alter table public.reading_progress_log
  add column notes text;

comment on column public.reading_progress_log.notes is
  'Anotação opcional do user pra esse dia de leitura — trecho/sentimento/contexto. Independente de reading.review.';
