-- Permite volumes decimais (ex.: 2.5) para livros "extra" de uma série que
-- não fazem parte da numeração principal — spin-offs, contos, side stories.
--
-- Antes `volume` era `smallint` (só inteiros). `numeric(4,1)` cobre 0.1 a
-- 999.9 com uma casa decimal — suficiente pra qualquer série real.
--
-- O check constraint `volume is null or volume > 0` é type-agnostic e
-- continua válido após a troca de tipo.

alter table public.book
  alter column volume type numeric(4, 1)
  using volume::numeric(4, 1);
