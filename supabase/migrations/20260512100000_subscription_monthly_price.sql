-- Adds `monthly_price` to `subscription` so the user doesn't need to retype
-- the same amount for every book that came in via subscription.
--
-- Contract: when the user picks a subscription on a book form, the price
-- field is auto-filled with `monthly_price`. The value is then snapshot into
-- `book.purchase_price` on save — books cadastrated before a price change
-- keep their old amount; only future selections pick up the new value.
--
-- Nullable to support existing subscriptions that didn't have a price set.

alter table public.subscription
  add column if not exists monthly_price numeric(10, 2);

comment on column public.subscription.monthly_price is
  'Monthly amount paid for this subscription. Auto-fills book.purchase_price '
  'when the subscription is picked on the book form. Snapshot per book — '
  'changing this value affects only books cadastrated afterwards.';
