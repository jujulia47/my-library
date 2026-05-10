-- ============================================================================
-- Migration 0002_auth_and_rls.sql
-- Habilitar Row Level Security + criar policies + setup do bucket de imagens
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE RLS em todas as tabelas
-- ----------------------------------------------------------------------------

alter table public.author              enable row level security;
alter table public.category            enable row level security;
alter table public.serie               enable row level security;
alter table public.book                enable row level security;
alter table public.reading             enable row level security;
alter table public.quote               enable row level security;
alter table public.wishlist            enable row level security;
alter table public.collection          enable row level security;
alter table public.book_author         enable row level security;
alter table public.book_category       enable row level security;
alter table public.collection_book     enable row level security;
alter table public.collection_serie    enable row level security;
alter table public.collection_wishlist enable row level security;

-- ----------------------------------------------------------------------------
-- 2. POLICIES
-- Padrão: usuário autenticado só acessa registros onde user_id = auth.uid()
-- ----------------------------------------------------------------------------

-- author --------------------------------------------------------------------
create policy "author_select_own" on public.author
  for select to authenticated using (auth.uid() = user_id);
create policy "author_insert_own" on public.author
  for insert to authenticated with check (auth.uid() = user_id);
create policy "author_update_own" on public.author
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "author_delete_own" on public.author
  for delete to authenticated using (auth.uid() = user_id);

-- category ------------------------------------------------------------------
create policy "category_select_own" on public.category
  for select to authenticated using (auth.uid() = user_id);
create policy "category_insert_own" on public.category
  for insert to authenticated with check (auth.uid() = user_id);
create policy "category_update_own" on public.category
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "category_delete_own" on public.category
  for delete to authenticated using (auth.uid() = user_id);

-- serie ---------------------------------------------------------------------
create policy "serie_select_own" on public.serie
  for select to authenticated using (auth.uid() = user_id);
create policy "serie_insert_own" on public.serie
  for insert to authenticated with check (auth.uid() = user_id);
create policy "serie_update_own" on public.serie
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "serie_delete_own" on public.serie
  for delete to authenticated using (auth.uid() = user_id);

-- book ----------------------------------------------------------------------
create policy "book_select_own" on public.book
  for select to authenticated using (auth.uid() = user_id);
create policy "book_insert_own" on public.book
  for insert to authenticated with check (auth.uid() = user_id);
create policy "book_update_own" on public.book
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "book_delete_own" on public.book
  for delete to authenticated using (auth.uid() = user_id);

-- reading -------------------------------------------------------------------
create policy "reading_select_own" on public.reading
  for select to authenticated using (auth.uid() = user_id);
create policy "reading_insert_own" on public.reading
  for insert to authenticated with check (auth.uid() = user_id);
create policy "reading_update_own" on public.reading
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reading_delete_own" on public.reading
  for delete to authenticated using (auth.uid() = user_id);

-- quote ---------------------------------------------------------------------
create policy "quote_select_own" on public.quote
  for select to authenticated using (auth.uid() = user_id);
create policy "quote_insert_own" on public.quote
  for insert to authenticated with check (auth.uid() = user_id);
create policy "quote_update_own" on public.quote
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quote_delete_own" on public.quote
  for delete to authenticated using (auth.uid() = user_id);

-- wishlist ------------------------------------------------------------------
create policy "wishlist_select_own" on public.wishlist
  for select to authenticated using (auth.uid() = user_id);
create policy "wishlist_insert_own" on public.wishlist
  for insert to authenticated with check (auth.uid() = user_id);
create policy "wishlist_update_own" on public.wishlist
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wishlist_delete_own" on public.wishlist
  for delete to authenticated using (auth.uid() = user_id);

-- collection ----------------------------------------------------------------
create policy "collection_select_own" on public.collection
  for select to authenticated using (auth.uid() = user_id);
create policy "collection_insert_own" on public.collection
  for insert to authenticated with check (auth.uid() = user_id);
create policy "collection_update_own" on public.collection
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "collection_delete_own" on public.collection
  for delete to authenticated using (auth.uid() = user_id);

-- book_author ---------------------------------------------------------------
create policy "book_author_select_own" on public.book_author
  for select to authenticated using (auth.uid() = user_id);
create policy "book_author_insert_own" on public.book_author
  for insert to authenticated with check (auth.uid() = user_id);
create policy "book_author_update_own" on public.book_author
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "book_author_delete_own" on public.book_author
  for delete to authenticated using (auth.uid() = user_id);

-- book_category -------------------------------------------------------------
create policy "book_category_select_own" on public.book_category
  for select to authenticated using (auth.uid() = user_id);
create policy "book_category_insert_own" on public.book_category
  for insert to authenticated with check (auth.uid() = user_id);
create policy "book_category_update_own" on public.book_category
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "book_category_delete_own" on public.book_category
  for delete to authenticated using (auth.uid() = user_id);

-- collection_book -----------------------------------------------------------
create policy "collection_book_select_own" on public.collection_book
  for select to authenticated using (auth.uid() = user_id);
create policy "collection_book_insert_own" on public.collection_book
  for insert to authenticated with check (auth.uid() = user_id);
create policy "collection_book_update_own" on public.collection_book
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "collection_book_delete_own" on public.collection_book
  for delete to authenticated using (auth.uid() = user_id);

-- collection_serie ----------------------------------------------------------
create policy "collection_serie_select_own" on public.collection_serie
  for select to authenticated using (auth.uid() = user_id);
create policy "collection_serie_insert_own" on public.collection_serie
  for insert to authenticated with check (auth.uid() = user_id);
create policy "collection_serie_update_own" on public.collection_serie
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "collection_serie_delete_own" on public.collection_serie
  for delete to authenticated using (auth.uid() = user_id);

-- collection_wishlist -------------------------------------------------------
create policy "collection_wishlist_select_own" on public.collection_wishlist
  for select to authenticated using (auth.uid() = user_id);
create policy "collection_wishlist_insert_own" on public.collection_wishlist
  for insert to authenticated with check (auth.uid() = user_id);
create policy "collection_wishlist_update_own" on public.collection_wishlist
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "collection_wishlist_delete_own" on public.collection_wishlist
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. STORAGE: bucket "images" + policies
-- ----------------------------------------------------------------------------

-- Cria o bucket "images" (idempotente). Public = true para que <Image> exiba
-- as capas sem signed URLs. As policies abaixo restringem ESCRITA por usuário.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Convenção de path: "{user_id}/{uuid}.{ext}"
-- Isso permite usar storage.foldername(name)[1] como user_id

create policy "images_upload_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "images_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'images');

create policy "images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
