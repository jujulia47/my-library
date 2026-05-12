-- Adiciona policies UPDATE e DELETE em book_status_history.
--
-- Contexto: a migration original (session_17_1_structural) deixou a tabela
-- como append-only — só SELECT e INSERT permitidos. Isso fez sentido enquanto
-- as entries eram intocáveis. Mas hoje a regra de negócio precisa permitir:
--
--   - UPDATE: sincronizar `changed_at` da primeira entry quando o user muda
--     `book.acquired_at` (regra "histórico bate com a data de aquisição").
--   - DELETE: remover a entry inicial quando o user limpa `book.acquired_at`
--     (regra "sem data de aquisição = nenhum 'entrou no acervo' no histórico").
--
-- Sem essas policies, as operações de update/delete no `updateBookFull` eram
-- aceitas pelo cliente mas silenciosamente bloqueadas pelo Postgres — o
-- histórico ficava com a data errada (geralmente a de criação do registro).
--
-- Segurança: filtro por user_id mantém isolamento entre usuários.

create policy "bsh_update_own" on public.book_status_history
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "bsh_delete_own" on public.book_status_history
  for delete to authenticated
  using (user_id = auth.uid());
