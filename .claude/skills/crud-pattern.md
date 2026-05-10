# CRUD Pattern — my-library

Padrão completo de CRUD estabelecido no fluxo de **livro** (sessões 1–5.8). Use isso como template para criar novos CRUDs (série completa, coleção, citação, wishlist autônoma). Os exemplos sempre apontam pro arquivo correspondente; quando criar a entidade `X`, espelhe a estrutura.

## Estrutura de pastas

```
src/app/{entity}/
  page.tsx              ← listagem (Server Component)
  new/page.tsx          ← form mínimo
  edit/[id]/page.tsx    ← form completo
  [slug]/page.tsx       ← detail page

src/components/
  Read/{Entity}/
    {Entity}Filters.tsx  ← painel de filtros + chips ativos
    {Entity}Empty.tsx    ← exporta NoX e NoFilteredX
  Create/{Entity}Minimal.tsx
  Update/{Entity}Full.tsx
  DetailsPage/{Entity}DetailClient.tsx
  forms/{Entity}FormModal.tsx (se houver sub-CRUD via modal)
  {Entity}Card/index.tsx (card de listagem se houver visual rico)

src/services/{entity}List.ts  ← query parametrizada com URL search params
src/services/{entity}.ts      ← queries individuais (getBySlug, etc.)

src/actions/
  create{Entity}Minimal.ts
  update{Entity}Full.ts
  delete{Entity}.ts
  (+ ações sub-entidade quando aplicável)
```

Modelos de referência: `src/app/book/`, `src/components/Read/Book/`, `src/components/Create/BookMinimal.tsx`, `src/components/Update/BookFull.tsx`, `src/components/DetailsPage/BookDetailClient.tsx`, `src/services/bookList.ts`.

## 1. Listagem — `src/app/{entity}/page.tsx`

Server Component async. Lê `searchParams` (Next 15: `Promise`), chama service, renderiza.

Exemplo: `src/app/book/page.tsx:31-98`.

```tsx
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // parse URL params (statuses, sort, year, etc.)
  const [items, counts, years] = await Promise.all([
    bookListQuery({ ... }),
    bookCounts(),
    yearsWithFinishedReadings(),
  ]);
  // ...
  return (
    <AppShell>
      <PageHeader
        title="Livros"
        subtitle={counts.total === 0 ? "Sua estante começa aqui" : `${total} títulos · ${finished} lidos`}
        actions={<><BookFilters yearsAvailable={years} /><Button as="Link" href="/book/new" variant="primary" size="sm">+ Adicionar livro</Button></>}
      />
      {items.length === 0
        ? counts.total === 0 ? <NoBooks /> : <NoFilteredBooks />
        : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map(b => <BookCard key={b.id} book={b} />)}
          </div>}
    </AppShell>
  );
}
```

### Pontos importantes
- **URL é fonte de verdade** dos filtros. Nada de state interno persistente. Mudar filtro → `router.push(?status=...)`. Compartilhável via link.
- `parseList(v)` divide string CSV ("a,b,c") em array. Helper repetido em `BookFilters.tsx:57-60` e `book/page.tsx:21-25`. Tem que reescrever em cada lado porque um é Client e outro Server, mas a forma é igual.
- `pickFirst(v)` extrai primeiro valor quando Next manda `string | string[]`.
- Validar enum/sort com `Set` antes de usar — se valor inválido na URL, fallback para default. Exemplo: `VALID_SORTS` em `book/page.tsx:13-19`.
- `Promise.all` quando há queries independentes (lista + counts + years).

### Service de listagem — `src/services/{entity}List.ts`

Padrão de `src/services/bookList.ts`:
- Tipo `XListParams` com todos os filtros opcionais
- Tipo `XListItem` que estende `XRow` e adiciona campos derivados (joins flatten, "latest_reading", etc.)
- Função `xListQuery(params)` retorna `Promise<XListItem[]>`
- Filtros nativos do Postgres (mapeáveis a colunas) → encadear `.eq/.in/.overlaps`
- Filtros derivados (status calculado a partir de relação) → resolver em memória após o fetch (anotar TODO de view materializada se a tabela crescer)
- Sort: a maioria nativo. Sort derivado (`last_reading_desc`) também em memória.
- Funções auxiliares de contagem: `xCounts()` retornando `{ total, finished }` ou similar
- Funções auxiliares pra popular dropdown de filtros: `yearsWithFinishedReadings()` etc.

## 2. Filtros — `src/components/Read/{Entity}/{Entity}Filters.tsx`

Client Component. Modelo: `src/components/Read/Book/BookFilters.tsx`.

### Layout
- **Linha de controles** que vai como `actions` do PageHeader: `[Botão Filtros][Select de Sort]`
- **Faixa de chips ativos** abaixo do header (`Card size="sm" mb-6 mt-4`) com Badges removíveis (X que chama `removeListItem`) + botão "Limpar tudo" alinhado à direita
- **Drawer/Painel** lateral direito no desktop (`md:right-0 md:w-80 md:h-screen`), bottom-sheet no mobile (`bottom-0 max-h-[85vh] rounded-t-xl`). z-index 50 (cobre sidebar z-40).

### Mecânica
- `useSearchParams + usePathname + useRouter` pra mexer na URL
- `setParam({key: value | null})` helper que reescreve query string preservando outros params
- `toggleListItem(key, current, val)` adiciona/remove de array CSV
- `removeListItem(key, current, val)` força remoção
- `clearAll()` zera todos os params relacionados a filtros
- `activeChips` é array construído com label, variant, e callback de remoção — facilita iterar
- `useEffect` para body scroll lock enquanto painel aberto

### Empty states
Componente `XEmpty` exporta **dois sub-componentes**:
- `NoX`: vazio absoluto (zero registros) — CTA "Adicionar X"
- `NoFilteredX`: vazio por filtro — CTA "Limpar filtros" que chama `router.push(pathname)`

Modelo: `src/components/Read/Book/BookEmpty.tsx`.

## 3. Form mínimo — `src/components/Create/{Entity}Minimal.tsx`

Para o `/{entity}/new`. Filosofia: campos essenciais apenas. O usuário completa detalhes depois via edit.

Modelo: `src/components/Create/BookMinimal.tsx`.

### Layout
- Wrapper `font-body max-w-5xl`
- ReturnBtn no topo
- `<h1>` `font-display text-3xl` + subtitle italic
- Tudo dentro de um `<Card>`
- Quando há capa/imagem, **grid duas colunas no desktop**:
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8">
    <div className="space-y-5 order-2 md:order-1">{/* campos */}</div>
    <div className="order-1 md:order-2">
      <div className="md:sticky md:top-4">{/* CoverUpload */}</div>
    </div>
  </div>
  ```
  No mobile a capa vem primeiro (order-1), no desktop fica à direita (order-2). Capa é sticky pra acompanhar scroll.
- Footer: `border-t border-border pt-5 mt-6`, botões alinhados à direita: **Cancelar (ghost) + ação primary + ação accent (CTA secundário)**
  - Ex.: "Cadastrar livro" (primary) + "Cadastrar e registrar leitura" (accent-moss)
  - O CTA accent passa um campo extra no FormData via `name="and_register_reading" value="true"` que a action lê pra decidir o destino do redirect.

### Submit
- `useTransition` pra `isPending`
- `onSubmit` faz `e.preventDefault()`, monta `FormData(e.currentTarget)`, chama action dentro de `startTransition`
- Action pode jogar throw (ver `error-handling.md`); o componente captura e seta `error` state
- Filtra `NEXT_REDIRECT` do erro (vem do `redirect()` do Next):
  ```ts
  if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
    setError(err.message);
  }
  ```
- Erro genérico aparece num alert acima do footer:
  ```tsx
  <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">{error}</p>
  ```

### Campos progressivos
Quando há campo opcional volumoso (ex.: série), o padrão é "expansível por click". Veja `BookMinimal.tsx:94-129`:
```tsx
{!serieExpanded && !serie ? (
  <button onClick={() => setSerieExpanded(true)}>+ Adicionar a uma série</button>
) : (
  <div className="rounded-md border border-border bg-paper/40 p-4 space-y-3">
    <SerieSelect ... />
    <Input label="Volume" ... />
    <button>× Remover da série</button>
  </div>
)}
```

## 4. Form completo — `src/components/Update/{Entity}Full.tsx`

Para `/{entity}/edit/[id]`. **Não use wizard/stepper.** Use seções verticais (Cards empilhados).

Modelo: `src/components/Update/BookFull.tsx`.

### Layout
- Wrapper `font-body max-w-4xl`
- ReturnBtn no topo
- `<h1>` + subtitle (mostra o nome do registro: `book.title`)
- `<form>` com `space-y-6 pb-24` (pb pra não esconder atrás do footer fixo)
- `<input type="hidden" name="id" value={id} />` e outros hiddens necessários (`slug`, etc.)
- Cada seção é um `<Card>` com `<h2 className="font-display text-xl font-medium text-ink-deep mb-5 pb-3 border-b border-border">{seção}</h2>` + campos
- Seções típicas: "Dados", "Categorias", "Posse", "Leitura" — separadas porque conceitualmente são domínios distintos
- Dentro de seção com capa: mesmo grid `[1fr_280px]` do BookMinimal
- Field pairs em grids: `grid grid-cols-1 sm:grid-cols-2 gap-4` ou `sm:grid-cols-3 gap-4`

### Footer fixo
Padrão estabelecido em `BookFull.tsx:327-351`:
```tsx
<div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-ivory/95 backdrop-blur-sm border-t border-border z-30">
  <div className="max-w-4xl mx-auto px-6 py-4 flex justify-end gap-2">
    <Button as="Link" href={...} variant="ghost" type="button">Cancelar</Button>
    <Button type="submit" variant="primary" loading={isPending} disabled={!validation}>
      Salvar alterações
    </Button>
  </div>
</div>
```
- `lg:left-60` respeita o sidebar do AppShell
- `bg-ivory/95 backdrop-blur-sm` para legibilidade quando há conteúdo abaixo
- `pb-24` no form pra reservar espaço

### Status com radio "pill-style"
Quando o status muda visibilidade de campos (ex.: `disposed_date` aparece só se `ownership_status === "disposed"`), use radio buttons estilizados como pills, não Select. Veja `BookFull.tsx:238-267`:
```tsx
<fieldset>
  <legend>Status</legend>
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <label className={checked ? "bg-moss text-ivory-light border-moss" : "bg-ivory-light border-border hover:bg-paper-soft"}>
        <input type="radio" name="status" value={opt.value} checked={checked} onChange={...} className="sr-only" />
        {opt.label}
      </label>
    ))}
  </div>
</fieldset>
```
A seleção precisa estar em state (`useState`) pra controlar `disabled`/`hidden` de campos dependentes.

## 5. Detail page — `src/components/DetailsPage/{Entity}DetailClient.tsx`

Para `/{entity}/[slug]`. A page (`src/app/{entity}/[slug]/page.tsx`) é Server Component que faz queries pesadas e passa props pro Client Component.

Modelo: `src/components/DetailsPage/BookDetailClient.tsx`.

### Estrutura
1. **ReturnBtn** topo
2. **Header** flex com:
   - À esquerda: `<h1>` (text-4xl) + subtitle (original_title em italic) ou autor
   - À direita: botões de ação principais + dropdown "..."
3. **Hero** (Card com capa + metadata): `flex flex-col md:flex-row gap-8`
4. **Sub-cards** verticais: cada `<Card className="mt-6">` para uma seção (Sobre, Posse, Leituras, Citações)

### Header / botões de ação
```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
  <div className="min-w-0">{/* h1 + subtitle */}</div>
  <div className="flex items-center gap-2 flex-wrap">
    <Button variant="accent-moss" size="sm">CTA primário</Button>
    <Button variant="secondary" size="sm">CTA secundário</Button>
    {/* Dropdown "..." pra ações secundárias (editar, marcar como X, excluir) */}
    <div className="relative">
      <button onClick={() => setActionsOpen(o => !o)} onBlur={() => setTimeout(() => setActionsOpen(false), 150)}>
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>
      {actionsOpen && (
        <div className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-ivory-light shadow-lg z-20">
          <Link onMouseDown={e => e.preventDefault()}>Editar</Link>
          <button onMouseDown={...}>Outra ação</button>
          <button className="text-burgundy hover:bg-burgundy/10 border-t border-border">Excluir</button>
        </div>
      )}
    </div>
  </div>
</div>
```
**Truque**: `onBlur` com `setTimeout(150ms)` permite que clicks no dropdown fechem após executar (senão o blur fecha antes). `onMouseDown preventDefault` evita perder foco.

### Hero
```tsx
<Card>
  <div className="flex flex-col md:flex-row gap-8">
    <div className="md:w-1/3 flex-shrink-0">
      <div className="relative w-full max-w-xs mx-auto md:mx-0" style={{ aspectRatio: "2 / 3" }}>
        {cover ? <Image src={url} alt fill priority /> : <BookCoverFallback ... />}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      {/* autor, série, badges, dl de metadata, sinopse compacta */}
    </div>
  </div>
</Card>
```

### Sub-cards de listagens relacionadas
Cada item da lista é um sub-card com border-l colorida pelo status (ver `design-system.md` — padrão do `border-l-[3px]` colorido). Inclui hover actions (editar/excluir aparecem no `group-hover`). Modais inline (`ReadingFormModal`, `QuoteFormModal`) abertos via state.

### Auto-trigger de modal via query param
Padrão estabelecido em `BookDetailClient.tsx:152-161` para CTA de fluxo cruzado ("Cadastrar e registrar leitura" do BookMinimal redireciona com `?action=new-reading`):
```tsx
useEffect(() => {
  if (searchParams.get("action") === "new-reading") {
    setReadingModal({ open: true, reading: null });
    // limpa o query param da URL sem reload
    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    router.replace(qs ? `?${qs}` : `/book/${slug}`, { scroll: false });
  }
}, []);
```

## 6. Modais para sub-CRUDs — `src/components/forms/{Entity}FormModal.tsx`

Para CRUDs encaixados (leitura dentro de livro, citação dentro de livro). Reuse `src/components/forms/Modal.tsx` (full-screen mobile, centralizado desktop).

Modelo: `src/components/forms/ReadingFormModal.tsx`.

### Padrão de FormModal
- Props: `open`, `onClose`, ids/slugs do parent, `entity?: T | null` (null = create, objeto = edit)
- `isEdit = !!entity`
- Title varia: "Registrar leitura" / "Editar leitura"
- `<form onSubmit>` com `<input type="hidden">` pro `book_id`/`book_slug` e `id` quando edit
- Action retorna `ActionResult` (não throw); modal usa `result.ok` pra decidir
- Em sucesso: `router.refresh() + onClose()`
- Em erro: setar state `error` e mostrar inline acima do footer (`bg-burgundy/10 border-burgundy/30`)

### Campos condicionais por status
Pattern em `ReadingFormModal.tsx:130-174`:
```tsx
<div className="grid grid-cols-2 gap-3">
  <Input label="Início" name="start_date" type="date" />
  {status !== "reading" && <Input label="Fim" name="finish_date" type="date" />}
</div>
{(status === "reading" || status === "paused") && <Input label="Página atual" ... />}
{status === "finished" && <StarRating label="Avaliação" value={rating} onChange={setRating} name="rating" />}
{(status === "finished" || status === "abandoned") && <Textarea label="Resenha" ... />}
```
A action também precisa **respeitar essas regras no servidor** — campos não aplicáveis viram `null` antes de inserir (veja `createReading.ts:60-66`).

## 7. Hard delete

Sempre via `<ConfirmDialog variant="destructive" />`. Padrão em `BookDetailClient.tsx:789-806` e `BookCard/index.tsx:146-164`.

```tsx
<ConfirmDialog
  open={confirmOpen}
  onClose={() => { setConfirmOpen(false); setError(null); }}
  onConfirm={handleDelete}
  title="Excluir livro?"
  description={
    error
      ? error  // mostra erro do server quando há falha
      : `"${book.title}" será removido. Todas as leituras, citações e relações associadas também serão removidas. Esta ação não pode ser desfeita.`
  }
  confirmLabel="Excluir"
  cancelLabel="Cancelar"
  variant="destructive"
  loading={isPending}
/>
```
- Title pergunta com `?`
- Description avisa do **cascade** (FK cascade do banco → deleta filhos juntos)
- Se erro vier, sobrescreve a description com a mensagem
- `loading` evita double-click

Após delete bem sucedido: `router.push("/{entity}")` se está no detail, `router.refresh()` se está em listagem/card.

## 8. Multiselect com auto-create (autores, séries)

Padrão de `AuthorMultiSelect` e `SerieSelect`. Setup:
1. **API route** `/api/{entities}/search?q=...` em `src/app/api/{entities}/search/route.ts` — autenticada, retorna até 8 matches via `.ilike("name", %q%)`
2. **Action** `create{Entity}Minimal` aceita `name: string`, retorna `{ ok: true, id, name } | { ok: false, message }`
3. **Componente** com debounce 200ms na busca
4. **Detecção de similaridade**: antes de criar, normaliza o nome digitado e compara com matches existentes via `normalizeName` (`src/utils/normalizeName.ts`). Se houver match similar (acentos/case diferentes), abre painel "Já existe X. Quer usar essa? [Usar existente] [Criar mesmo assim]"
5. **Hidden inputs** quando dentro de form: `<input type="hidden" name={hiddenFieldName} value={id} />` por item selecionado

Veja `src/components/ui/AuthorMultiSelect.tsx` e `src/components/ui/SerieSelect.tsx`.

## 9. Multiselect com lista rígida (categorias)

Padrão de `CategoryMultiSelect`. Diferenças:
- Recebe `options: CategoryOption[]` da página (passado pelo Server Component)
- **Não cria inline** — texto não-correspondente bloqueia submit
- `onValidationChange(isValid)` reporta validade pro form pai, que desabilita "Salvar" enquanto inválido
- Atalho "+ Criar essa categoria" abre `QuickCategoryModal` (modal aninhado dentro do form sem aninhar `<form>` — usa `<div>` com botão que dispara handler manualmente — ver `QuickCategoryModal.tsx:18-21`)
- Empty state especial quando `options.length === 0` (link pra `/category` para popular)

## 10. Layout responsivo

### Breakpoints (Tailwind padrão)
- `sm` 640px — celular maior / tablet portrait
- `md` 768px — tablet
- `lg` 1024px — desktop pequeno (sidebar fixa aparece)
- `xl` 1280px — desktop grande

### Convenções
- **Mobile portrait**: stack vertical, modais full-screen, drawer de filtros bottom-up, footer de form não-fixo (deixa scrollar), botões empilhados (`flex-col sm:flex-row`)
- **Tablet (md)**: cards em 3 colunas; sidebar continua hambúrguer; capa de form aparece à direita
- **Desktop (lg)**: sidebar fixa `lg:ml-60`, footer de form fixo (`fixed bottom-0 lg:left-60`), drawer de filtros lateral direito
- **xl+**: cards 4-5 colunas

### Containers principais
- `max-w-6xl mx-auto px-6 py-8` em AppShell (universal)
- `max-w-5xl` em forms mínimos
- `max-w-4xl` em forms completos e detail pages

## 11. Items polimórficos (collection_item)

A coleção (`collection_item`) é o exemplo de canônico de N:N polimórfico no projeto. Cada linha aponta pra **um** book OU **um** wishlist via XOR:

```sql
constraint collection_item_exactly_one
  check ((book_id is null) <> (wishlist_id is null))
```

Padrões adotados na sessão 9.2:

- **Unique partial por tipo**: `unique (collection_id, book_id) where book_id is not null` (mesmo pra wishlist_id) — duplicata só é detectada dentro do mesmo "lado".
- **Migração entre tipos** (ex: wishlist → book quando o usuário compra): faça `update set book_id = X, wishlist_id = null, was_wishlist = true where wishlist_id = Y` **antes** de deletar a wishlist. A FK tem `on delete cascade`, então deletar a wishlist primeiro destrói os items. A coluna `was_wishlist` preserva memória histórica e ativa um badge "Comprado" no card.
- **Service de detail consolida ambos os lados**: `collectionDetail.ts` retorna um único array `CollectionItem` com discriminator `kind: "book" | "wishlist"`. Componentes consumidores fazem `switch(item.kind)`.
- **Search APIs com exclusão**: `/api/{books,wishlist}/search-for-collection?exclude_collection_id=X` retorna candidatos que **ainda não estão** na coleção (faz `select id from collection_item where collection_id = X and {book_id|wishlist_id} is not null` e usa `.not("id", "in", "(uuid,uuid,...)")` no segundo query).
- **Seções como tag livre**: `collection_item.section text` é texto livre (sem tabela `section` separada). Renomear/excluir seção = `update collection_item set section = X|null where collection_id = Y and section = old_name`. Empty/null vira pseudo-seção "Sem seção" na UI.

Referências: `src/services/collectionDetail.ts`, `src/components/DetailsPage/CollectionDetailClient.tsx`, `src/actions/addCollectionItem.ts`, `src/actions/renameSection.ts`.

## 12. Convenções de seed inicial

Quando o usuário ainda não tem nada, ofereça seed via action (ver `seedDefaultCategories.ts`). RPC no banco (`seed_default_categories`) preenche tabela. Empty state da listagem pode ter botão "Adicionar padrões" que dispara o action.

## Checklist ao criar um CRUD novo

1. Schema da tabela já existe e RLS configurada?
2. Tipos regenerados (`supabase gen types ...`)? Ver `data-conventions.md`
3. Service de listagem com `XListParams` e flatten dos joins
4. Service auxiliar de contagens / dados pra filtros (anos, etc.)
5. Page de listagem (`page.tsx`) que chama service com URL params, usa `PageHeader`, `XFilters`, `EmptyState` (2 variantes), grid de cards ou DataTable
6. Form mínimo + action `create{Entity}Minimal` (slug direto via `formateTitleToSlug`, `user_id`, redirect em sucesso — ver `data-conventions.md` "Slug duplicado é erro")
7. Form completo + action `update{Entity}Full` (sync de N:N junctions, tratamento de cover, redirect)
8. Detail page com hero + sub-cards + dropdown "..." + integração com modais
9. ConfirmDialog para delete + action `delete{Entity}` com `ActionResult`
10. Modais de sub-entidades quando aplicável
11. ERROR_MAP atualizado com constraints novos do schema
