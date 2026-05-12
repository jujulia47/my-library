-- Changes `reading.rating` and `serie.rating` from smallint to numeric(2,1)
-- so users can give half-star ratings (e.g., 2.5).
--
-- Constraint guarantees:
--   - between 0 and 5
--   - only whole or half steps (no 2.7, 3.13 etc.) — `rating * 2 = floor(rating * 2)`
--
-- Existing integer values are preserved bit-perfect by the type widening.

alter table public.reading
  drop constraint if exists reading_rating_check;

alter table public.reading
  alter column rating type numeric(2, 1) using rating::numeric(2, 1);

alter table public.reading
  add constraint reading_rating_check
  check (
    rating is null
    or (
      rating between 0 and 5
      and rating * 2 = floor(rating * 2)
    )
  );

alter table public.serie
  drop constraint if exists serie_rating_check;

alter table public.serie
  alter column rating type numeric(2, 1) using rating::numeric(2, 1);

alter table public.serie
  add constraint serie_rating_check
  check (
    rating is null
    or (
      rating between 0 and 5
      and rating * 2 = floor(rating * 2)
    )
  );

comment on column public.reading.rating is
  'Half-star rating: 0 to 5 in 0.5 increments. NULL means unrated.';
comment on column public.serie.rating is
  'Half-star rating: 0 to 5 in 0.5 increments. NULL means unrated.';
