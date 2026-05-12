-- Sincroniza retroativamente a primeira entrada (mais antiga) de
-- `book_status_history` com `book.acquired_at` pra cada livro.
--
-- Por que: a sincronização runtime no `updateBookFull` antes filtrava por
-- `notes = 'criado'` + `status = 'owned'`, mas:
--   1. Livros criados antes dessa convenção têm `notes` NULL — não eram
--      pegos pelo filtro.
--   2. Livros que entraram direto como digitais (kindle/audible) têm
--      status != 'owned' — também ficavam fora.
-- Resultado: livros mostravam "Entrou no acervo · DD/MM/YYYY" com a data
-- de criação do registro, não a data de aquisição que o usuário informou.
--
-- Esta migration força a sincronização uma única vez. O fix do runtime já
-- foi aplicado na action — daqui pra frente, futuros saves mantêm os dois
-- valores sincronizados.

update public.book_status_history bsh
set changed_at = (b.acquired_at::timestamp + interval '12 hours') at time zone 'UTC'
from public.book b
where bsh.book_id = b.id
  and b.acquired_at is not null
  and bsh.id = (
    select id
    from public.book_status_history
    where book_id = b.id
    order by changed_at asc, id asc
    limit 1
  );
