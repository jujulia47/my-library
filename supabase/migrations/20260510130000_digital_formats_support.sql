-- Suporte a livros 100% digitais — duas adições paralelas:
--
-- 1) `purchase_origin` ganha `audible` (irmão do `kindle_unlimited` adicionado
--    na migration anterior). Assinatura mensal que dá acesso a audiobooks —
--    pago via mensalidade, sem registro individual de assinatura nem preço
--    por livro. No form, mostra só a data de aquisição.
--
-- 2) `ownership_status` ganha `kindle` e `audible`. Quando o livro é só digital
--    (sem formato físico marcado), "Em casa / Emprestei / Doei / etc." perdem
--    sentido — o "estado físico" passa a indicar a PLATAFORMA onde o arquivo
--    vive. Default automatizado no form: e-book → kindle, audiobook → audible.
--
-- Segurança: três `add value if not exists` idempotentes; nenhuma mudança em
-- dados. Roda fora de transação implícita do Supabase CLI sem problema desde
-- Postgres 12 — os novos valores não são usados na mesma transação.

alter type public.purchase_origin add value if not exists 'audible';
alter type public.ownership_status add value if not exists 'kindle';
alter type public.ownership_status add value if not exists 'audible';
