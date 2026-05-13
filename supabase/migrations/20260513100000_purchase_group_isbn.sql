-- Adds `isbn` to `purchase_group` so users can register the box's own
-- ISBN (printed on the box packaging) separately from the individual book
-- ISBNs. Both fields coexist: each book in the box can still have its own
-- `book.isbn` if the individual volumes carry their own codes.
--
-- Nullable — many boxes don't expose a dedicated ISBN; users might leave
-- it blank.

alter table public.purchase_group
  add column if not exists isbn text;

comment on column public.purchase_group.isbn is
  'ISBN of the box/kit itself (the bundle has its own code, different from '
  'the individual book ISBNs inside). Optional.';
