-- Adiciona o valor `kindle_unlimited` ao enum `purchase_origin`.
--
-- Por que: livros lidos via Kindle Unlimited não cabem em `assinatura` da
-- forma como ela existe hoje (assinatura aponta pra registro em `subscription`
-- e tipicamente carrega preço pago). KU é semanticamente distinto — é um
-- acesso por mensalidade, sem registro individual de assinatura nem preço por
-- livro. Vira origem própria; o form só pede a data de aquisição (acquired_at).
--
-- Segurança: `add value if not exists` é idempotente; nenhuma mudança em
-- dados existentes. Roda fora de transação implícita do Supabase CLI sem
-- problema desde Postgres 12 porque o novo valor não é usado nesta mesma
-- transação.

alter type public.purchase_origin add value if not exists 'kindle_unlimited';
