-- ============================================================================
-- Migration: enriquecer autor (sessão 13.1)
-- 1. enum country
-- 2. author: photo_url, country, birth_year, death_year, bio + check constraints
-- 3. author_bibliography (preparado pra render na 13.2)
-- 4. storage bucket author-photos
-- ============================================================================

-- 1. Enum country (snake_case sem acento — UI mapeia pra label/bandeira)
do $$ begin
  create type public.country as enum (
    'africa_do_sul', 'alemanha', 'angola', 'argentina', 'australia',
    'brasil', 'cabo_verde', 'canada', 'chile', 'china',
    'colombia', 'coreia_do_sul', 'cuba', 'egito', 'espanha',
    'estados_unidos', 'franca', 'holanda', 'hungria', 'india',
    'irlanda', 'israel', 'italia', 'japao', 'mexico',
    'mocambique', 'noruega', 'peru', 'polonia', 'portugal',
    'reino_unido', 'republica_tcheca', 'russia', 'suecia', 'turquia'
  );
exception when duplicate_object then null; end $$;

-- 2. author: campos enriquecidos
alter table public.author
  add column if not exists photo_url text,
  add column if not exists country public.country,
  add column if not exists birth_year integer,
  add column if not exists death_year integer,
  add column if not exists bio text;

-- Constraints com nomes explícitos pro ERROR_MAP
alter table public.author
  add constraint author_birth_year_valid
  check (birth_year is null or (birth_year >= 1 and birth_year <= 9999));

alter table public.author
  add constraint author_death_year_valid
  check (death_year is null or (death_year >= 1 and death_year <= 9999));

alter table public.author
  add constraint author_birth_before_death
  check (
    birth_year is null
    or death_year is null
    or birth_year <= death_year
  );

-- 3. author_bibliography (obras canônicas conhecidas do autor; pode incluir
--    livros que o user nunca cadastrou em book — fica visível na 13.2)
create table if not exists public.author_bibliography (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references public.author(id) on delete cascade,
  title text not null,
  title_normalized text generated always as (
    lower(public.immutable_unaccent(title))
  ) stored,
  publication_year integer,
  notes text,
  created_at timestamptz not null default now(),

  constraint author_bibliography_unique_title unique (author_id, title_normalized),
  constraint author_bibliography_year_valid
    check (
      publication_year is null
      or (publication_year >= 1 and publication_year <= 9999)
    )
);

create index if not exists author_bibliography_author_idx
  on public.author_bibliography(author_id);

alter table public.author_bibliography enable row level security;

create policy "ab_select_own"
  on public.author_bibliography for select to authenticated
  using (auth.uid() = user_id);

create policy "ab_insert_own"
  on public.author_bibliography for insert to authenticated
  with check (auth.uid() = user_id);

create policy "ab_update_own"
  on public.author_bibliography for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ab_delete_own"
  on public.author_bibliography for delete to authenticated
  using (auth.uid() = user_id);

-- 4. Storage bucket pra fotos de autor (público, write owner-only via path).
--    Mesmo padrão do bucket "images" (sessão init): primeiro segmento do path
--    é o user_id, RLS via storage.foldername(name)[1].
insert into storage.buckets (id, name, public)
values ('author-photos', 'author-photos', true)
on conflict (id) do nothing;

create policy "Author-photos: insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'author-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Author-photos: select public"
  on storage.objects for select
  to public
  using (bucket_id = 'author-photos');

create policy "Author-photos: update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'author-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'author-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Author-photos: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'author-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
