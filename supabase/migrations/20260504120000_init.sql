-- ============================================================================
-- Migration 0001_init.sql
-- My Library - schema inicial
-- Single-user com auth.users do Supabase
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------

create extension if not exists "pgcrypto" with schema extensions;
-- gen_random_uuid() vem do pgcrypto

-- ----------------------------------------------------------------------------
-- 2. ENUMS
-- ----------------------------------------------------------------------------

create type public.reading_status as enum (
  'reading',
  'paused',
  'finished',
  'abandoned'
);

create type public.serie_status as enum (
  'tbr',
  'reading',
  'paused',
  'finished',
  'abandoned'
);

create type public.collection_status as enum (
  'current',
  'finished',
  'abandoned'
);

create type public.collection_type as enum (
  'challenge',
  'list',
  'shelf',
  'subscription'
);

create type public.ownership_status as enum (
  'owned',
  'disposed',
  'lent',
  'never_owned'
);

create type public.acquisition_type as enum (
  'purchased',
  'gift',
  'subscription',
  'swap',
  'borrowed',
  'inherited',
  'other'
);

create type public.book_format as enum (
  'physical',
  'ebook',
  'audiobook'
);

create type public.book_language as enum (
  'pt_BR',
  'en',
  'es',
  'fr',
  'it',
  'de',
  'ja',
  'other'
);

create type public.wishlist_priority as enum (
  'low',
  'medium',
  'high'
);

-- ----------------------------------------------------------------------------
-- 3. TRIGGER FUNCTION para updated_at
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. TABELAS PRINCIPAIS
-- ----------------------------------------------------------------------------

-- author --------------------------------------------------------------------
create table public.author (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  bio text,
  photo text,
  nationality text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index author_user_id_idx on public.author(user_id);

create trigger author_set_updated_at
  before update on public.author
  for each row execute function public.set_updated_at();

-- category ------------------------------------------------------------------
create table public.category (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index category_user_id_idx on public.category(user_id);

create trigger category_set_updated_at
  before update on public.category
  for each row execute function public.set_updated_at();

-- serie ---------------------------------------------------------------------
create table public.serie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  qty_volumes smallint check (qty_volumes is null or qty_volumes > 0),
  collection_complete boolean not null default false,
  status public.serie_status not null default 'tbr',
  current_book_id uuid, -- FK adicionada após book
  start_date date,
  finish_date date,
  rating smallint check (rating is null or (rating between 1 and 5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  check (finish_date is null or start_date is null or finish_date >= start_date)
);

create index serie_user_id_idx on public.serie(user_id);

create trigger serie_set_updated_at
  before update on public.serie
  for each row execute function public.set_updated_at();

-- book ----------------------------------------------------------------------
create table public.book (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  original_title text,
  slug text not null,
  cover text,
  isbn text,
  publisher text,
  publication_year smallint check (
    publication_year is null
    or publication_year between 1000 and (extract(year from now())::int + 5)
  ),
  synopsis text,
  pages int check (pages is null or pages > 0),
  language public.book_language,
  serie_id uuid references public.serie(id) on delete set null,
  volume smallint check (volume is null or volume > 0),
  formats_owned public.book_format[],
  ownership_status public.ownership_status not null default 'owned',
  acquisition_type public.acquisition_type,
  acquisition_date date,
  disposed_date date,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  check (
    disposed_date is null
    or acquisition_date is null
    or disposed_date >= acquisition_date
  )
);

-- ISBN único por usuário, mas só quando preenchido (partial unique index)
create unique index book_user_isbn_unique
  on public.book(user_id, isbn)
  where isbn is not null;

create index book_user_id_idx on public.book(user_id);
create index book_serie_id_idx on public.book(serie_id);
create index book_title_idx on public.book(title);
create index book_ownership_status_idx on public.book(ownership_status);

create trigger book_set_updated_at
  before update on public.book
  for each row execute function public.set_updated_at();

-- agora que book existe, fechar a FK de serie.current_book_id
alter table public.serie
  add constraint serie_current_book_id_fkey
  foreign key (current_book_id)
  references public.book(id)
  on delete set null;

create index serie_current_book_id_idx on public.serie(current_book_id);

-- reading -------------------------------------------------------------------
create table public.reading (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.book(id) on delete cascade,
  status public.reading_status not null,
  format public.book_format,
  start_date date,
  finish_date date,
  current_page int check (current_page is null or current_page >= 0),
  rating smallint check (rating is null or (rating between 1 and 5)),
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (finish_date is null or start_date is null or finish_date >= start_date),
  check (start_date is null or start_date <= current_date),
  check (finish_date is null or finish_date <= current_date)
);

create index reading_user_id_idx on public.reading(user_id);
create index reading_book_id_idx on public.reading(book_id);
create index reading_status_idx on public.reading(status);
create index reading_finish_date_idx on public.reading(finish_date);

create trigger reading_set_updated_at
  before update on public.reading
  for each row execute function public.set_updated_at();

-- quote ---------------------------------------------------------------------
create table public.quote (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.book(id) on delete cascade,
  text text not null,
  page int check (page is null or page > 0),
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index quote_user_id_idx on public.quote(user_id);
create index quote_book_id_idx on public.quote(book_id);

create trigger quote_set_updated_at
  before update on public.quote
  for each row execute function public.set_updated_at();

-- wishlist ------------------------------------------------------------------
-- Wishlist autônoma: livros que você QUER mas ainda não tem.
-- Quando comprar, vira um registro em "book" e o item da wishlist é deletado.
create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author_name text,
  cover text,
  isbn text,
  purchase_link text,
  estimated_price numeric(10,2) check (estimated_price is null or estimated_price >= 0),
  priority public.wishlist_priority,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wishlist_user_id_idx on public.wishlist(user_id);
create index wishlist_priority_idx on public.wishlist(priority);

create trigger wishlist_set_updated_at
  before update on public.wishlist
  for each row execute function public.set_updated_at();

-- collection ----------------------------------------------------------------
create table public.collection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  type public.collection_type not null,
  status public.collection_status not null default 'current',
  start_date date,
  finish_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  check (finish_date is null or start_date is null or finish_date >= start_date)
);

create index collection_user_id_idx on public.collection(user_id);
create index collection_type_idx on public.collection(type);

create trigger collection_set_updated_at
  before update on public.collection
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. TABELAS DE JUNÇÃO (N:N)
-- ----------------------------------------------------------------------------

-- book_author ---------------------------------------------------------------
create table public.book_author (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.book(id) on delete cascade,
  author_id uuid not null references public.author(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (book_id, author_id)
);

create index book_author_user_id_idx on public.book_author(user_id);
create index book_author_book_id_idx on public.book_author(book_id);
create index book_author_author_id_idx on public.book_author(author_id);

-- book_category -------------------------------------------------------------
create table public.book_category (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.book(id) on delete cascade,
  category_id uuid not null references public.category(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (book_id, category_id)
);

create index book_category_user_id_idx on public.book_category(user_id);
create index book_category_book_id_idx on public.book_category(book_id);
create index book_category_category_id_idx on public.book_category(category_id);

-- collection_book -----------------------------------------------------------
create table public.collection_book (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collection(id) on delete cascade,
  book_id uuid not null references public.book(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (collection_id, book_id)
);

create index collection_book_user_id_idx on public.collection_book(user_id);
create index collection_book_collection_id_idx on public.collection_book(collection_id);
create index collection_book_book_id_idx on public.collection_book(book_id);

-- collection_serie ----------------------------------------------------------
create table public.collection_serie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collection(id) on delete cascade,
  serie_id uuid not null references public.serie(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (collection_id, serie_id)
);

create index collection_serie_user_id_idx on public.collection_serie(user_id);
create index collection_serie_collection_id_idx on public.collection_serie(collection_id);
create index collection_serie_serie_id_idx on public.collection_serie(serie_id);

-- collection_wishlist -------------------------------------------------------
create table public.collection_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collection(id) on delete cascade,
  wishlist_id uuid not null references public.wishlist(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (collection_id, wishlist_id)
);

create index collection_wishlist_user_id_idx on public.collection_wishlist(user_id);
create index collection_wishlist_collection_id_idx on public.collection_wishlist(collection_id);
create index collection_wishlist_wishlist_id_idx on public.collection_wishlist(wishlist_id);
