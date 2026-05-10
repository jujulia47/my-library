# My Library — Setup do Banco e Próximos Passos

Este pacote contém:

- **0001_init.sql** — schema inicial (tabelas, enums, FKs, índices, checks)
- **0002_auth_and_rls.sql** — Row Level Security + policies + bucket de imagens
- **Este documento** — passo a passo de setup e checklist do que mudar no código

---

## Resumo das mudanças no schema

### Tabelas novas
- **`author`** — autores como entidade própria (relação N:N com book via `book_author`)
- **`category`** — categorias/gêneros como entidade própria (N:N com book via `book_category`)
- **`reading`** — substitui os campos de leitura na tabela `book` E a tabela `rereading` antiga. Agora cada leitura (1ª ou releitura) é um registro próprio.
- **`book_author`**, **`book_category`** — junções N:N

### Tabelas mantidas (com mudanças)
- **`book`** — perdeu: `is_single_book`, `library`, `status`, `init_date`, `finish_date`, `current_page`, `version`, `rating`. Ganhou: `original_title`, `isbn`, `publisher`, `publication_year`, `synopsis`, `formats_owned`, `ownership_status`, `acquisition_type`, `disposed_date`.
- **`serie`** — `serie_name` virou `name`; ganhou `description`
- **`collection`** — `collection_name` virou `name`; `type_collection` virou `type`
- **`quote`** — coluna `quote` virou `text`
- **`wishlist`** — agora autônoma. Tem campos próprios: `title`, `author_name`, `cover`, `isbn`, `purchase_link`, `estimated_price`, `priority`, `notes`. **Não tem mais `book_id`.**

### Tabelas removidas
- **`rereading`** — substituída pela tabela `reading`

### Convenções
- IDs viraram **UUID** (`gen_random_uuid()`) em vez de bigint
- Toda tabela tem `user_id` referenciando `auth.users(id)` com `ON DELETE CASCADE`
- `created_at` e `updated_at` em toda tabela; `updated_at` é atualizado automaticamente por trigger
- Enums em inglês

---

## Setup passo a passo

### 1. Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux/Windows: ver https://supabase.com/docs/guides/cli/getting-started
```

### 2. Inicializar Supabase no projeto

Na raiz do projeto (`my-library/`):

```bash
supabase init
```

Cria a pasta `supabase/` com a estrutura padrão.

### 3. Linkar com o projeto remoto

```bash
supabase link --project-ref qoposqagubgqjtbeuqzz
```

Vai pedir o database password do projeto Supabase (Dashboard → Project Settings → Database → Connection string).

### 4. Salvar as migrations

```bash
mkdir -p supabase/migrations
```

Copie os arquivos com timestamp no nome (Supabase exige formato `YYYYMMDDHHMMSS_descricao.sql`):

```bash
cp 0001_init.sql           supabase/migrations/20260504120000_init.sql
cp 0002_auth_and_rls.sql   supabase/migrations/20260504120001_auth_and_rls.sql
```

### 5. Aplicar no banco remoto

```bash
supabase db push
```

Aplica as duas migrations em ordem. Se o projeto novo está vazio, vai funcionar sem conflitos.

### 6. Gerar tipos TypeScript

```bash
supabase gen types typescript --linked > src/utils/typings/supabase.ts
```

Sobrescreve o arquivo de tipos com o schema novo. **Apague em seguida** o arquivo `src/utils/typings/index.ts` ou pelo menos os tipos antigos dele (`Book`, `Serie`, `Wishlist`, etc.) — eles vão estar desatualizados e divergentes.

### 7. Atualizar variáveis de ambiente

Em `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://qoposqagubgqjtbeuqzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua nova anon key>
```

A anon key está em Dashboard → Project Settings → API.

### 8. Conferir o bucket "images"

A migration tenta criar o bucket. Se não criou (depende das permissões), faça manualmente:

- Dashboard → Storage → New bucket
- Nome: `images`
- Public: ✅

As policies do bucket já estão na migration 0002.

### 9. Configurar Auth e criar sua conta

- Dashboard → Authentication → Providers → Email → habilite
- Authentication → Users → Add user → preencha email e senha (essa é a sua conta)
- Depois disso, recomendo desabilitar signup público: Auth → Settings → User Signups → Disable

---

## Checklist de mudanças no código

Em ordem de prioridade. O app **não vai funcionar** sem os bloqueadores.

### Bloqueadores

#### 1. Implementar auth com `@supabase/ssr`

Hoje você usa `@supabase/supabase-js` puro com a anon key. Com RLS habilitada, **toda query precisa de uma sessão autenticada**, ou retorna vazio.

```bash
npm install @supabase/ssr
```

Você vai criar:

- `src/utils/supabase/client.ts` — cliente para Client Components
- `src/utils/supabase/server.ts` — cliente para Server Components e Server Actions
- `src/middleware.ts` — middleware do Next que renova sessão a cada request
- `src/app/login/page.tsx` — tela de login
- Botão de logout no `SideMenu`

Tutorial oficial passo a passo: https://supabase.com/docs/guides/auth/server-side/nextjs

Depois de criar, **trocar TODOS os imports** de `@/utils/supabaseClient` pelo cliente novo (server ou browser conforme contexto). O arquivo antigo `supabaseClient.tsx` pode ser deletado.

#### 2. Adicionar `user_id` em todas as inserções

Toda action que faz `insert` precisa pegar o user da sessão:

```ts
const supabase = await createClient(); // o novo, do server
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Não autenticado');

await supabase.from('book').insert({ ...dados, user_id: user.id });
```

#### 3. Atualizar referências de campos renomeados/removidos

| Antes (código atual) | Depois |
|---|---|
| `book.is_single_book` | derivar de `serie_id IS NULL` |
| `book.library` | `book.ownership_status === 'owned'` |
| `book.status` | criar/atualizar registro em `reading` |
| `book.init_date / finish_date` | `reading.start_date / finish_date` |
| `book.current_page` | `reading.current_page` |
| `book.rating` | `reading.rating` |
| `book.version` (array) | `book.formats_owned` (mesma ideia, nome novo) |
| `serie.serie_name` | `serie.name` |
| `collection.collection_name` | `collection.name` |
| `collection.type_collection` | `collection.type` |
| `quote.quote` | `quote.text` |
| tabela `rereading` | tabela `reading` (mesma lógica, sem distinção entre 1ª e releitura) |

### Bugs conhecidos para corrigir junto

#### 4. `createBook.ts` — bug da série existente

Quando `serie_name` é digitada e a série já existe, o código encontra mas faz `return` em vez de atribuir o ID. Corrigir:

```ts
if (serieData) {
  serieId = serieData.id;   // ← era 'return' antes
}
```

#### 5. `updateBook.ts` — sobrescrita do cover

Hoje sempre seta `cover: coverPath` no update, mesmo quando `coverPath` é null. Corrigir construindo o objeto dinamicamente:

```ts
const updateData: Record<string, unknown> = {
  title, slug, /* ... outros campos ... */
};
if (cover && cover.size > 0) {
  // faz upload e atribui
  updateData.cover = coverPath;
}
await supabase.from('book').update(updateData).eq('id', id);
```

Também: `.update([{...}])` está com colchetes (array). O método espera objeto: `.update({...})`.

#### 6. `createCollection.ts` — falta `'use server'`

Adicionar `'use server'` no topo, igual aos outros actions.

#### 7. `uploadImage.ts` — colisão de nomes

Hoje usa `file.name` como path no Storage. Duas capas chamadas `cover.jpg` se sobrescrevem. Com RLS por pasta de usuário (configurada na 0002), o path precisa começar com user_id:

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Não autenticado');

const ext = file.name.split('.').pop();
const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

const { data, error } = await supabase.storage
  .from('images')
  .upload(path, file, { cacheControl: '3600', upsert: false });
```

#### 8. Limpar dívidas

- Deletar `src/components/Update/bookbackup.tsx` (235 linhas, não importado)
- Deletar tipos antigos de `src/utils/typings/index.ts` (use só os gerados em `supabase.ts`)
- Tirar os `console.log` remanescentes nos actions

### Novos fluxos para construir

#### 9. Página `/wishlist/new`

Form com os campos da nova tabela: `title`, `author_name`, `cover`, `isbn`, `purchase_link`, `estimated_price`, `priority`, `notes`. O botão "Novo livro na Wishlist" da listagem (que hoje dá 404) finalmente vai funcionar.

#### 10. Botão "Marcar como adquirido" na página de detalhe da wishlist

Comportamento sugerido (mais seguro do que deletar antes):

1. Botão redireciona pra `/book/new?from_wishlist={id}`
2. A página `/book/new` lê o query param, busca o registro da wishlist, e pré-preenche o form
3. Quando o usuário **salva o livro com sucesso**, a action de criar livro também deleta o registro da wishlist
4. Se o usuário fechar a aba antes de salvar, a wishlist permanece intacta

#### 11. Páginas `/author` e `/author/[slug]`

- `/author` — listagem de cards (foto, nome, contagem de livros)
- `/author/[slug]` — detalhe com bio + lista de livros desse autor

#### 12. Multiselect de autores e categorias no form de livro

Você já tem o componente `MultiSelectWithTags`. Vai precisar de actions auxiliares pra criar autor/categoria "on the fly" (igual ao fluxo atual de série, que cria a série se ela não existir ao salvar o livro).

#### 13. Reformular o form de livro

Separar visualmente em três blocos:

- **Dados do livro** — título, autores, ISBN, editora, ano, sinopse, etc. (fica em `book`)
- **Posse** — `formats_owned`, `ownership_status`, `acquisition_type`, `acquisition_date` (fica em `book`)
- **Leitura** — opcional. Ao marcar "registrar leitura", abre seção pra criar registro em `reading` (status, formato, datas, página atual, rating, review)

Antes era tudo um só; agora "criar livro" e "registrar leitura" são ações conceitualmente distintas (mesmo que o form possa fazer as duas de uma vez).

### Refactors recomendados antes de seguir

- Quebrar `CreateBook.tsx` (~822 linhas) e `UpdateBook.tsx` (~811 linhas) em subcomponentes (um por bloco do form, por exemplo)
- Adicionar `react-hook-form` + `zod` para validação dos forms — vai facilitar muito a regra de "campo X só aparece se Y" que está na DOCUMENTACAO.md

---

## Como ficam as queries que você vai precisar

Pra te dar uma ideia do que muda na hora de buscar dados:

**Total de livros lidos no ano:**
```sql
select count(*) from reading
where status = 'finished'
  and extract(year from finish_date) = 2026
  and user_id = auth.uid();
```

**Quantas vezes li o livro X:**
```sql
select count(*) from reading
where book_id = '...' and status = 'finished';
```

**Livros TBR (que tenho mas nunca li):**
```sql
select b.* from book b
where b.ownership_status = 'owned'
  and not exists (
    select 1 from reading r
    where r.book_id = b.id and r.status = 'finished'
  )
  and b.user_id = auth.uid();
```

**Livro com seus autores (já que agora é N:N):**
```sql
select b.*, array_agg(a.name) as authors
from book b
left join book_author ba on ba.book_id = b.id
left join author a on a.id = ba.author_id
where b.id = '...'
group by b.id;
```

Ou via Supabase JS:
```ts
const { data } = await supabase
  .from('book')
  .select('*, authors:book_author(author(*)), categories:book_category(category(*))')
  .eq('id', id)
  .single();
```

---

## Próximos passos sugeridos

1. **Hoje:** rodar setup (passos 1-9), conferir que o schema sobe sem erros
2. **Em seguida:** implementar auth (item 1 do checklist) — sem isso nada funciona com RLS
3. **Depois:** atualizar actions para o schema novo (itens 2-7)
4. **Por último:** construir os fluxos novos (autores, wishlist→book, etc.)

Qualquer erro nos passos 1-9, me manda o output que a gente debuga.
