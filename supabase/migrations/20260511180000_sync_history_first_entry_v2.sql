-- Versão v2 da sincronização retroativa da primeira entry de
-- book_status_history com book.acquired_at. A v1 (20260511170000) usava
-- `at time zone 'UTC'` em update correlacionado e, por algum motivo (precedência?
-- ordem de avaliação do planner?), não estava efetivando em alguns ambientes.
--
-- Esta versão usa CTE com DISTINCT ON pra deixar a query mais óbvia e a
-- conversão de date pra timestamptz mais explícita.

with first_entries as (
  select distinct on (book_id) id as history_id, book_id
  from public.book_status_history
  order by book_id, changed_at asc, id asc
)
update public.book_status_history bsh
set changed_at = (b.acquired_at::text || ' 12:00:00+00')::timestamptz
from first_entries fe
join public.book b on b.id = fe.book_id
where bsh.id = fe.history_id
  and b.acquired_at is not null;
