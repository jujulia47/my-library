# Data Conventions — my-library

Convenções do banco, RLS, tipos, helpers de slug/normalização, storage e datas. Tudo que vale para escrever uma action correta neste projeto.

## Schema

### Convenções gerais
Migrations em `supabase/migrations/` (formato `YYYYMMDDHHMMSS_descricao.sql`).

Toda tabela de domínio:
- **`id uuid primary key default gen_random_uuid()`** — UUID, nunca bigint
- **`user_id uuid not null references auth.users(id) on delete cascade`** — toda linha pertence a um usuário
- **`created_at timestamptz not null default now()`**
- **`updated_at timestamptz not null default now()`** — atualizado por trigger `set_updated_at()` (definido em `20260504120000_init.sql:90-98`)
- **Slug por usuário**: quando há slug, constraint `unique (user_id, slug)`. Index dedicado em `user_id`.
- **Enums em inglês** (`reading_status`, `ownership_status`, `acquisition_type`, `book_format`, `book_language`, etc. — ver migration init.sql:18-84)

Ex.: `author` em `20260504120000_init.sql:104-116`:
```sql
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
```

### Junções N:N

Sempre tabela própria com `id` UUID + `user_id` + ambas as FKs cascateando + `created_at`. Exemplo: `book_author`, `book_category`, `collection_book`, `collection_serie`, `collection_wishlist`. Sempre incluir `user_id` na linha da junção (RLS).

## RLS

**Habilitado em todas as tabelas** via `20260504120001_auth_and_rls.sql:10-22`. Padrão de policy uniforme:
```sql
create policy "X_select_own" on public.X for select to authenticated using (auth.uid() = user_id);
create policy "X_insert_own" on public.X for insert to authenticated with check (auth.uid() = user_id);
create policy "X_update_own" on public.X for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "X_delete_own" on public.X for delete to authenticated using (auth.uid() = user_id);
```

Implicações práticas:
- **Toda query precisa de sessão autenticada** (sem isso, retorna vazio)
- **Toda inserção precisa de `user_id`** explicitamente — RLS bloqueia inserts sem `user_id = auth.uid()`
- A action faz `getUser()` antes de qualquer operação e injeta `user.id` no payload

## Padrão de action

Toda Server Action começa assim:
```ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { translateSupabaseError, type ActionResult } from "@/utils/translateSupabaseError";

export async function fooAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  // 1. extrair / validar campos do FormData
  // 2. operação no Supabase, sempre com user_id no insert
  // 3. translateSupabaseError em caso de erro do banco
  // 4. revalidatePath nos paths afetados
  // 5. retornar { ok: true } ou redirect
}
```

Variante para actions que usam `redirect()`: throw em erro em vez de retornar `ActionResult`. Ver `error-handling.md`.

### Inserir `user_id` em **TODOS** os inserts
**Sem exceção** — incluindo tabelas de junção:
```ts
await supabase.from("book_author").insert(rows.map(r => ({
  book_id: bookData.id,
  author_id: r.id,
  user_id: user.id,    // ← obrigatório, RLS exige
})));
```
Veja `createBookMinimal.ts:109-118` e `updateBookFull.ts:172-178`.

## Slug duplicado é erro, não conflito a esconder

**Decisão de produto (sessão 6):** dois registros com o mesmo nome/título do mesmo usuário são quase sempre um erro de cadastro — duas edições do mesmo livro merecem sufixo no título ("Harry Potter e a Pedra Filosofal" vs "Harry Potter e a Pedra Filosofal — MinaLima"), não slugs `harry-potter` e `harry-potter-2` automaticamente diferentes.

**Não use** geração de slug com sufixo automático (`base-2`, `base-3`, UUID fallback). Em vez disso:
1. Gere o slug direto via `formateTitleToSlug(name)`
2. Insira no banco
3. Se a unique constraint `entity_user_slug_key` dispara, deixe subir
4. `translateSupabaseError` mapeia o constraint pra mensagem inline no campo certo (ver `error-handling.md`)

Multiselect com auto-create (autores, séries via `createAuthor`/`createSerieMinimal`) é a **única** exceção: ali o usuário digita "Tolkien" e queremos reaproveitar a entidade existente, não criar duplicata. Esses actions fazem `select` antes do `insert` e retornam o id existente. Não usam sufixos — se há colisão de slug com um nome diferente (raro), o erro sobe normalmente.

## `formateTitleToSlug`

`src/utils/formateTitleToSlug.ts:1-11`. Converte texto livre em slug:
- NFD + remove combining marks (acentos)
- lowercase
- espaços → `-`
- remove tudo que não for alfanumérico ou `-`
- colapsa hífens duplos, trim de hífens nas extremidades

Use **sempre** quando precisar gerar slug de título/nome do usuário.

## Slugs acompanham o campo principal (sessão 6.4)

**Decisão revertida:** o slug é regenerado server-side toda vez que o campo principal muda em um update. Campo principal:
- `book`, `quote` → `title` / `text`
- `serie`, `category`, `collection` → `name`

Implicações no código:
- Actions de `update*` chamam `formateTitleToSlug(...)` no início e incluem `slug` no payload do `.update()`
- O slug **não vem** do form. Hidden inputs `name="slug"` foram removidos. A action ignora qualquer `formData.get("slug")` que sobrar
- `revalidatePath` e `redirect` usam o **slug novo**, não o antigo
- URLs antigas deixam de funcionar após rename. Bookmarks pessoais quebram, aceitável em uso pessoal

Se o slug regerado colide com outro registro do mesmo user, a unique constraint `entity_user_slug_key` dispara e `translateSupabaseError` traduz pra erro inline no campo correspondente (`title` pra book, `name` pras outras).

Quotes: o slug inclui sufixo UUID (`{seed}-{6 chars}`), então cada update gera slug diferente mesmo se o texto não muda. É aceitável: quote raramente é compartilhada por URL.

## `normalizeName`

`src/utils/normalizeName.ts:8-15`. **Não use isso para gerar slug** — é só pra detecção de similaridade em multiselects:
- NFD + remove combining marks
- lowercase
- colapsa whitespace
- trim

A diferença pra `formateTitleToSlug`: preserva espaços (não vira `-`) e não remove pontuação. Uso típico: comparar "J.R.R. Tolkien" com "J. R. R. Tolkien" antes de criar duplicata em `AuthorMultiSelect`/`SerieSelect`.

## Storage path convention

Bucket: **`images`** (público, criado em `20260504120001_auth_and_rls.sql:165`).

Path **obrigatório**: `{user_id}/{uuid}.{ext}`. RLS do Storage usa `(storage.foldername(name))[1] = auth.uid()::text` (mesmo arquivo, linhas 173-198) — qualquer outro path é rejeitado.

```ts
const ext = file.name.split(".").pop() ?? "jpg";
const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
const { data, error } = await supabase.storage
  .from("images")
  .upload(path, file, { cacheControl: "3600", upsert: false });
```

**Nunca use `file.name` como path** — colide com qualquer outra capa que tenha o mesmo nome ("cover.jpg"). UUID garante unicidade.

Veja `createBookMinimal.ts:74-84` e `updateBookFull.ts:99-112`.

### Construindo URL pública
Use `imagesUrl` de `src/services/images.ts` (passa o path retornado e devolve a public URL completa pra `<Image>`).

## Tipos TypeScript do schema

Arquivo gerado: `src/utils/typings/supabase.ts`. **Sempre use esses tipos**, nunca interfaces caseiras.

```ts
import type { Database } from "@/utils/typings/supabase";

type BookRow = Database["public"]["Tables"]["book"]["Row"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type BookFormat = Database["public"]["Enums"]["book_format"];
```

Padrão em todo arquivo de action/component que mexe com banco. Para insert/update use `Database["public"]["Tables"]["book"]["Insert"]` e `["Update"]` respectivamente — eles têm campos opcionais corretos (sem id/created_at obrigatórios).

### Regenerar após cada migration

```bash
supabase gen types typescript --linked > src/utils/typings/supabase.ts
```

**Importante:** **não** use `2>&1` no redirect. A CLI emite `Initialising login role...` no stderr; se você combinar com stdout via `2>&1`, esse status line vai parar como linha 1 do `supabase.ts` e quebra o build com `Type error: Unexpected keyword`. Use `> file` puro (stderr vai pra terminal, stdout limpo pro arquivo) ou `2>/dev/null > file` se quiser silenciar a CLI. No PowerShell, equivalente é `2>$null` ou `Out-File -Encoding utf8`.

Sem isso, ts-build quebra ou pior, deixa passar inserts com colunas que não existem mais. Faça parte do checklist de aplicar migration:
1. Editar SQL em `supabase/migrations/YYYYMMDDHHMMSS_descricao.sql`
2. `supabase db push`
3. `supabase gen types typescript --linked > src/utils/typings/supabase.ts`
4. Commitar a migration E o arquivo de tipos juntos

### `pickEnum` helper

Padrão `pickEnum`/`pick` para validar enum vindo de FormData (string crua → enum tipado ou null):
```ts
function pickEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : null;
}
```
Veja `updateBookFull.ts:45-49` e `createReading.ts:22-26`. Reuse.

## Datas

### No banco
Tipo SQL: `date` (não `timestamp`). Formato: `YYYY-MM-DD`. O Supabase devolve string ISO.

### No form
`<Input type="date" />` mostra um picker nativo. **Cuidado**: quando vazio, manda string vazia `""` no FormData — não `null`. Sempre faça:
```ts
const acquisition_date = (formData.get("acquisition_date") as string) || null;
```

Validação extra para `markBookDisposed` (`createQuoteForBook.ts:95`):
```ts
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// ...
if (rawDate.trim() === "") disposed_date = null;
else if (ISO_DATE.test(rawDate)) disposed_date = rawDate;
else return { ok: false, error: "invalid_input", message: "Data inválida." };
```
Use esse regex sempre que a data vier de fonte que pode estar maquiada.

### No display
Use `formatDate` de `src/utils/formatDate.ts:1-12`:
```ts
new Date(dateString).toLocaleDateString("pt-BR", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "UTC"
});
```
Saída: "5 mai. 2026". `timeZone: "UTC"` evita off-by-one quando o servidor/cliente em fuso diferente.

Para datas longas em hero (ex.: "começou em 5 de maio de 2026"), inline `Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" })` — ver `BookDetailClient.tsx:186-195`.

Para duração ("3 meses e 2 dias"), use `calculateDuration(start, end)` de `formatDate.ts:48-92`.

## Status derivado a partir de relação

Padrão em `bookListQuery` (`bookList.ts`): livro não tem coluna `status`; deriva de `reading` mais recente.

Estratégia:
1. SELECT com left join na tabela filha: `.select("*, reading(*)")`
2. Após o fetch, ordena `reading[]` por `finish_date desc nulls last` em memória
3. `latest_reading` = primeiro item após sort
4. Se não há reading → status pseudo "tbr"

```ts
const sorted = (raw.reading ?? []).slice().sort((a, b) => {
  const af = a.finish_date ?? "";
  const bf = b.finish_date ?? "";
  if (af !== bf) return bf.localeCompare(af);
  const as = a.start_date ?? "";
  const bs = b.start_date ?? "";
  return bs.localeCompare(as);
});
```
Ver `bookList.ts:58-65`.

**Para mil+ registros** isso fica caro. TODO anotado no código (`bookList.ts:106-109`): criar view materializada `book_with_meta` com `latest_reading_status`, `latest_finish_date`, etc. Aplicar quando a tabela passar de ~1000 linhas.

## Fetching com joins de N:N

Padrão de Supabase JS:
```ts
.select(`*, book_author(author(name)), reading(*)`)
```
Retorna estrutura aninhada:
```json
{
  ...,
  "book_author": [{ "author": { "name": "X" } }],
  "reading": [{ ... }]
}
```
Flatten manual após fetch (ex.: `flatten()` em `bookList.ts:52-81` extrai `authors: string[]` da estrutura).

## Filtros nativos vs em memória

Regra:
- **Coluna direta** → filtro Postgres (`.eq`, `.in`, `.overlaps`, `.ilike`)
- **Atributo derivado de relação** → fetch e filtra em memória

Ex.: `formats_owned` é `book_format[]` numa coluna → use `.overlaps("formats_owned", validFormats)`. Status de leitura deriva de `reading` → filtro em memória.

## Search APIs (`/api/{entities}/search`)

Padrão em `src/app/api/authors/search/route.ts`:
```ts
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  let query = supabase
    .from("author")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true })
    .limit(8);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ authors: data ?? [] });
}
```

- Sempre auth-checked
- Limite 8 (suficiente pro dropdown do multiselect)
- `ilike` com `%q%` pra match parcial case-insensitive
- Retorna `{ entities: [...] }` (array nomeado, fácil de tipar no client)

Use isso pra qualquer multiselect com auto-create.

## `revalidatePath` — sempre invalidar caches Next

Após qualquer mutação, chamar `revalidatePath` nos paths que mostram esses dados:
```ts
revalidatePath("/book");
if (slug) revalidatePath(`/book/${slug}`);
```

Padrão em todas as actions. Sem isso, o usuário vai ver dados antigos após retornar via `router.refresh()`.

## Storage cleanup

**Hoje não fazemos**. Se um livro é deletado, sua capa fica órfã no bucket. Aceito por simplicidade — orphans não vazam custo significativo. Se precisar limpar no futuro, criar action que: 1) busca `book.cover` antes do delete, 2) `supabase.storage.from("images").remove([path])`, 3) deleta o livro.

## Lista de enums atuais

De `20260504120000_init.sql:18-84` + `20260506143431_reading_event_and_serie_cleanup.sql` (replicados em `Database["public"]["Enums"]`):

- `reading_status`: `reading | paused | finished | abandoned`
- `serie_status`: `tbr | reading | paused | finished | abandoned`
- `collection_status`: `current | finished | abandoned`
- `collection_type`: `challenge | list | shelf | subscription`
- `ownership_status`: `owned | disposed | lent | never_owned`
- `acquisition_type`: `purchased | gift | subscription | swap | borrowed | inherited | other`
- `book_format`: `physical | ebook | audiobook`
- `book_language`: `pt_BR | en | es | fr | it | de | ja | other`
- `wishlist_priority`: `low | medium | high`
- `reading_event_type`: `started | paused | resumed | finished | abandoned` (sessão 6.1)

## Histórico de leitura via `reading_event`

A tabela `reading` guarda apenas o **estado atual** de uma leitura (status + datas resumo + página atual + rating + review). O **histórico** de mudanças de status vive em `reading_event` (criada na migration `20260506143431`).

Toda mudança de status de uma reading deve criar um event correspondente:
- `started` — quando a reading é criada com status `reading`, ou quando volta ao status `reading` vinda de outro estado
- `paused` — status muda pra `paused`
- `resumed` — volta de `paused` pra `reading`
- `finished` — fecha como concluída
- `abandoned` — fecha como abandonada

Schema:
```sql
reading_event (
  id uuid pk,
  user_id uuid -> auth.users on delete cascade,
  reading_id uuid -> reading on delete cascade,
  event_type reading_event_type not null,
  event_date date not null,
  notes text,
  created_at timestamptz default now(),
  constraint reading_event_date_not_future check (event_date <= current_date)
)
```

Indexes em `reading_id`, `user_id`, `event_date`. RLS no padrão (4 policies por `auth.uid() = user_id`).

### Cálculo de duração total
Duração total de uma leitura = `event_date` do `started` mais recente até `event_date` do `finished` ou `abandoned` (ou `current_date` se ainda em andamento). **Pausas não descontam** — é tempo elapsado total, não tempo ativo lendo. Decisão de produto: o que importa é "quanto tempo o livro acompanhou você", não quantas horas o nariz ficou no papel.

### ERROR_MAP
`reading_event_date_not_future` → field `event_date`, "A data do evento não pode ser no futuro." (definido em `translateSupabaseError.ts`).

## Campos removidos da `serie` (sessão 6.1)

`serie.collection_complete` (boolean) e `serie.current_book_id` (uuid FK pra book) foram removidos. Implicações:
- "Volume atual" não é mais um campo persistido — passa a ser derivado do status dos livros da série (próximo livro com reading em andamento, ou primeiro tbr na ordem de volume). Implementação na sessão 6.2.
- "Coleção completa" (todos os volumes possuídos) também sai do schema; se voltar a fazer sentido, pode virar derivação de `book.ownership_status === 'owned'` para todos os volumes.

A FK `serie_current_book_id_fkey` e o índice `serie_current_book_id_idx` foram dropados junto com a coluna.

Ao adicionar novo enum, lembrar de:
1. Migration nova com `create type` + colunas/altera
2. Regenerar tipos
3. Mapear labels PT-BR no componente que renderiza (ex.: `acquisitionLabels` em `BookDetailClient.tsx:86-97`)
4. Validar no server com `pickEnum(value, allowed)`

## Checklist de criar entidade nova

1. Migration SQL com tabela + RLS + policies + trigger updated_at + indexes + constraints (com nomes explícitos pro ERROR_MAP)
2. `supabase db push`
3. `supabase gen types typescript --linked > src/utils/typings/supabase.ts`
4. Commitar migration + types juntos
5. ERROR_MAP atualizado se há novas constraints com mensagens específicas
6. Actions usando padrão (auth check + insert com user_id + translate + revalidate)
7. Service de listagem com types corretos
