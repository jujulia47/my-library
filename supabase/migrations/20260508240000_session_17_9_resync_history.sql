-- Sessão 17.9: re-sync idempotente das entries 'criado' do histórico cujo
-- `changed_at` divergiu de `book.acquired_at`. O fix da 17.7 atualizou só
-- registros antigos; novos casos foram gerados depois quando o sync condicional
-- do `updateBookFull` falhou em comparações sutis (tipo/timezone).
--
-- Esta migração cobre os casos em aberto e é seguro re-rodar — só toca em
-- entries onde `changed_at::date` realmente difere de `acquired_at`.

update public.book_status_history h
   set changed_at = (b.acquired_at::timestamptz + interval '12 hours')
  from public.book b
 where h.book_id = b.id
   and h.notes = 'criado'
   and h.status = 'owned'
   and b.acquired_at is not null
   and h.changed_at::date <> b.acquired_at;
