-- Remove o modelo v1 do plano de leitura (agendamento por livro + override por
-- dia). A página será reconstruída do zero com outro modelo (metas com
-- intervalo de páginas + capacidade por período + fila via home_next_read) —
-- nenhum dado destas tabelas é aproveitado.
drop table if exists public.reading_plan_day_override;
drop table if exists public.reading_plan_book;
