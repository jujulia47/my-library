-- Sessão 17.7: corrige entries iniciais 'criado' do histórico cujo `changed_at`
-- ficou apontando pra data de criação do registro no banco em vez de
-- `book.acquired_at`. Bug: livro cadastrado com data de aquisição passada (ex.:
-- "comprei semana passada") tinha a entry 'criado' marcada com hoje, e a
-- timeline mostrava mensagens incoerentes ("voltou ao estado em casa") porque
-- a ordenação por changed_at colocava o status terminal ANTES da criação.
--
-- Fix: alinha changed_at = acquired_at + 12h (meio-dia UTC, mesmo formato
-- usado pelas inserções programáticas em createBookMinimal/updateBookFull).
-- Só toca em entries onde a divergência é real (date diff). Idempotente.

update public.book_status_history h
   set changed_at = (b.acquired_at::timestamptz + interval '12 hours')
  from public.book b
 where h.book_id = b.id
   and h.notes = 'criado'
   and h.status = 'owned'
   and b.acquired_at is not null
   and h.changed_at::date <> b.acquired_at;
