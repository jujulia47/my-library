# Design System — my-library

Identidade visual e biblioteca de primitives. Tudo neste projeto usa **Tailwind CSS v4**: tokens (cores e fontes) definidos em `@theme` em `src/app/globals.css`. **Não há `tailwind.config.js`** — Tailwind v4 lê tudo do CSS. Quando precisar adicionar cor ou fonte, edite `globals.css`.

## Paleta

Todos os tokens viram utilities `bg-*`, `text-*`, `border-*` etc. Definidos em `src/app/globals.css:3-47`.

### Surfaces (fundo de página/cards)
- `ivory` `#F5F0E6` — **fundo da página** (body); `bg-ivory` no `<main>`
- `ivory-light` `#FAF6EC` — **fundo de Card default, inputs, modais** — sempre o tom mais claro de superfície
- `paper` `#EDE8DC` — **hover de cells/itens da lista**, header de tabela, fundo do drawer de filtros
- `paper-soft` `#E0D8C8` — fundo de panels secundários, blocos rebaixados (ex.: o bloco da Série inline em BookMinimal)

### Inks (texto)
- `ink-deep` `#4A3826` — **texto primário** (headings, body)
- `ink-soft` `#6B5D4F` — texto secundário, labels de tabela, descrições de modal
- `ink-fade` `#948977` — texto terciário italic, helper texts, "—" de campos vazios

### Cappuccino — primary
- `cappuccino` `#6B5240`, `cappuccino-soft` `#8B6F50`
- **Cor do botão `primary`** (`bg-cappuccino` → `hover:bg-ink-deep`). Substituiu o antigo `pine` em sessões anteriores. Use em ações principais não-destrutivas.

### Gold — acento amarelo / status "lendo"
- `gold` `#F0C040`, `gold-deep` `#8C6E1C`
- **Foco** (`focus:ring-gold/20`, `focus:border-gold`), **hover de borda em cards interativos** (`hover:border-gold`), **status "lendo"** (Badge variant `gold`), barra de progresso de leitura, links destacados (`text-gold-deep`).

### Burgundy — destrutivo
- `burgundy` `#82393A`, `burgundy-soft` `#A24749`
- **Botão destructive**, ícones de excluir, **status "abandoned"**, mensagens de erro (`text-burgundy`, `bg-burgundy/10 border-burgundy/30` em alert boxes).

### Moss — sucesso / status "lido" / posse "owned"
- `moss` `#5C6E47`, `moss-soft` `#6F8456`
- **Botão `accent-moss`** (CTA secundário positivo, ex.: "Cadastrar e registrar leitura"), **Badge "Lido"**, **Badge "Na estante"**.

### Olive — status "paused" / categorias
- `olive` `#85614B`
- **Badge "Pausado"**, **chips de categoria** (em `CategoryMultiSelect` usa olive). Tom warm intermediário entre moss e cappuccino.

### Navy — variante neutra "informativa"
- `navy` `#1E3A5F`, `navy-soft` `#2C5078`
- **Badge `navy`** para chip de período de leitura ("Lidos em 2025"). Use para metadata fria.

### Terracota — calor / "Assinatura"
- `terracota` `#BC6E48`, `terracota-soft` `#D08054`
- **Badge `terracota`** para destaque quente, ex.: tipo de aquisição "Assinatura". Disponível como `accent-terracota` no Button.

### Border
- `border` `#C9BFA8` — **única cor de borda** padrão. Use `border-border` em todo card/input/divisor.

## Tipografia

Definida em `@theme` de `globals.css` via tokens `--font-display` e `--font-body`. Fontes carregadas em `src/app/layout.tsx` via `@fontsource`.
- **`font-display`** — `Cormorant Garamond` — para headings, labels destacadas, decorações italic
- **`font-body`** — `EB Garamond` — para texto, inputs, labels de form, descrições

`globals.css` aplica `font-display` em todos os `h1-h6` automaticamente via `@layer base`. Não precisa repetir `font-display` em headings, mas é comum verem o uso explícito (`font-display text-3xl ...`) pra ficar claro. Body herda `font-body` do `<body>`.

### Tamanhos típicos (observados no código)
- Hero / page title em detail page: `text-4xl` (`BookDetailClient.tsx:281`)
- Page title em listagem (`PageHeader`): `text-[28px]` (`PageHeader.tsx:25`)
- Section header dentro de Card (`<h2>`): `text-xl` (`BookDetailClient.tsx:479`, `BookFull.tsx:113`)
- Subheading em form mínimo: `text-3xl` (`BookMinimal.tsx:56`)
- Body default: `text-base` (15-16px implícito) ou `text-sm`
- Helper text e metadata: `text-xs` em `text-ink-fade italic`
- Uppercase rótulos de campos em detail (dt): `text-xs uppercase tracking-wider text-ink-fade`

### Estilo italic ubíquo
- `<p>` de subtitle em `PageHeader` (`italic text-ink-fade`)
- Empty state description (`italic text-ink-soft`)
- Helper text de filtros, "começou em DD de mês"
- "ler resenha" toggles
- Citações no detail (`<blockquote>` com `font-display italic`)

Italic + `ink-fade` = "metadado decorativo, não é informação principal".

## Layout

### Container raiz
`AppShell` em `src/components/AppShell.tsx`:
```tsx
<main className="lg:ml-60 pt-14 lg:pt-0">
  <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
</main>
```
- `lg:ml-60` reserva espaço pro sidebar fixo no desktop; `pt-14` empurra abaixo da topbar do mobile
- Container interno: `max-w-6xl mx-auto px-6 py-8`

### Larguras de página típicas
- Listagens: deixam o `max-w-6xl` do AppShell mandar (sem wrapper extra)
- Forms (BookMinimal): `max-w-5xl`
- Forms longos (BookFull): `max-w-4xl`
- Detail page (BookDetailClient): `max-w-4xl`

### Grids comuns
- Cards de listagem (BookCard): `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6`
- Form com capa lateral: `grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8` (BookMinimal) ou `[1fr_280px] gap-6` (BookFull)
- Stats em detail page: `grid grid-cols-1 sm:grid-cols-2 ou sm:grid-cols-3 gap-4` em `<dl>`
- Field pairs em form: `grid grid-cols-1 sm:grid-cols-2 gap-4`

### Spacing
- Gap entre badges: `gap-2`
- Gap entre cards/seções verticais: `mt-6` ou `space-y-6`
- Gap em footer de form: `gap-2`
- Padding interno padrão de Card: `p-6` (size `md`); `p-4` (sm); `p-8` (lg)
- Vertical da página: `py-8` no container; PageHeader tem `pb-4 mb-8` próprio

### Sombra de Card
Definida em `globals.css:47` como `--shadow-card`:
```css
--shadow-card: 0 1px 2px rgba(74, 56, 38, 0.05), 0 4px 12px rgba(74, 56, 38, 0.06);
```
Hardcoded em `Card.tsx:11` para variant `default`. Variant `surface` é chapado (sem sombra). **Não aplique sombra em outros lugares** — use Card variant `default` quando quiser elevação.

## Convenções de cor por status

### `reading_status` → variant de Badge (StatusBadge gerencia)
- `reading` → `gold` "Lendo"
- `paused` → `olive` "Pausado"
- `finished` → `moss` "Lido"
- `abandoned` → `burgundy` "Abandonado"
- `tbr` (pseudo, sem registro de reading) → `fade` "Quero ler"

Tabela em `src/components/ui/StatusBadge.tsx:11-17`. Use `<StatusBadge kind="reading" status={...} />` em vez de hardcodar.

### `ownership_status` → variant
- `owned` → `moss` "Na estante"
- `disposed` → `fade` "Doado"
- `lent` → `olive` "Emprestado"
- `never_owned` → `fade` "Nunca tive"

### `collection_type` → variant (estabelecido na sessão 9.1, ampliado em 9.3)
Mapping vigente, exposto via `CollectionTypeBadge` em `src/components/ui/CollectionTypeBadge.tsx`:
- `shelf` (Estante) → `olive`
- `list` (Lista) → `moss`
- `challenge` (Desafio) → `gold`
- `subscription` (Assinatura) → `terracota`
- `wishlist` (Wishlist) → `navy` (sessão 9.3)

## Cor semântica (sessão 17.3)

Cada cor da paleta tem um papel fixo no app — quando aparece em qualquer lugar é por causa desse motivo. Documento completo em `.claude/docs/design-refresh.md`.

### Princípio
- **Bege** (ivory/paper) é a base de superfícies; **cor é a roupa** — só em elementos pequenos (border-l, ícones, chips, dots).
- Máximo 3 cores fortes por viewport. Áreas grandes ficam em tons neutros.

### Mapping global

| Cor | Papel | Onde aparece |
|---|---|---|
| `cappuccino` | Neutro warm / livro físico / botão primary | Botões primary, formato físico no donut, badges neutras |
| `gold` | Foco / leitura ativa / acento | Status "lendo", barras de progresso, mês default no chart, citação favorita, chips status |
| `gold-deep` | Gold em hover/ranking | Top 1 autor, ano grande no `/year`, citação ⭐ favorita |
| `burgundy` | Paixão / abandonado / destrutivo | Status "abandonado", botão delete, mês corrente, prioridade alta wishlist, "longest book" recorde |
| `moss` | Conclusão / e-book / sucesso | Status "finished", formato e-book, sparkline ritmo, conquistas, "fastest book" recorde |
| `navy` | Informação / metadado / saga | Série como saga (border-l-4), autor entidade, citações, países, "próximo da série" |
| `terracota` | Aquisição / assinatura / audio | Coleção wishlist/subscription, formato audiobook, wishlist border |
| `olive` | Estante / orgânico / categoria | Coleção tipo estante, filtro categoria |
| `ink-fade` | Pausado / desligado | Status "paused", "doado/vendido/perdido", autores fora do podium |

### Status do livro / reading

| reading_status | Cor | Token visual |
|---|---|---|
| `reading` | gold | border-l-3 gold + barra gold |
| `finished` | moss | border-l-3 moss + check |
| `paused` | ink-fade | border-l-3 ink-fade |
| `abandoned` | burgundy | border-l-3 burgundy |
| `tbr` (sem reading) | cappuccino | border-l-3 cappuccino |

### Status físico / ownership (sessão 17.2)

| ownership_status | Cor / variante |
|---|---|
| `owned` | moss (em casa, ativo) |
| `lent_out` | olive (emprestei, ainda meu) |
| `borrowed` | navy (peguei emprestado, info) |
| `returned` / `donated` / `sold` / `traded` | fade |
| `lost` | burgundy |

### Cor por grupo de filtro (sessão 17.3)

Cada grupo de filtro no `<FilterPanel>` recebe um ícone heroicon colorido ao lado do título. Ícones e cores:

| Grupo | Ícone | Cor |
|---|---|---|
| Status (reading) | `BookOpenIcon` | `text-gold` |
| Posse (ownership) | `ArchiveBoxIcon` | `text-moss` |
| Período (ano/mês) | `CalendarDaysIcon` | `text-navy` |
| Formato | `RectangleStackIcon` | `text-cappuccino` |
| Categoria | `TagIcon` | `text-olive` |
| Autor | `UserIcon` | `text-navy` |
| Avaliação | `StarIcon` | `text-gold-deep` |
| Origem (purchase) | `ShoppingBagIcon` | `text-terracota` |
| Tipo de coleção | `RectangleGroupIcon` | `text-cappuccino` |

Chips de filtro ativo seguem a mesma cor (Badge variant correspondente).

### Cores cíclicas — categorias / lombadas / timeline

8 cores em ordem fixa, atribuídas via hash do nome (`@/utils/colorByHash`):

```
1. burgundy
2. moss
3. navy
4. terracota
5. olive
6. gold-deep
7. cappuccino-soft
8. ink-soft
```

Mesma rotação usada em:
- `<GenrePie>` (pizza de gênero)
- `<YearTimeline>` (linhas dos livros)
- `/library` lombadas (sessão 17.4 prevista)

Hash simples (soma de char codes mod 8) — estável por nome, colisões aceitáveis.

### Mapping de formato (donut + chips)

| Formato | Cor | Onde |
|---|---|---|
| `physical` | `cappuccino` | Donut de formato, badge "Físico" |
| `ebook` | `moss` | Donut, badge "E-book" |
| `audiobook` | `terracota` | Donut, badge "Audiobook" |

### Cards de stats (home, detail, year)

Cada métrica tem ícone Heroicons + cor temática:

| Métrica | Ícone | Cor |
|---|---|---|
| Livros lidos | `BookOpenIcon` | `text-moss` |
| Páginas | `DocumentTextIcon` | `text-cappuccino` |
| Livros/mês | `ChartBarIcon` | `text-gold` |
| Média rating | `StarIcon` | `text-gold-deep` |
| Citações | `ChatBubbleLeftIcon` | `text-navy` |
| Autores | `UserGroupIcon` | `text-olive` |
| Tempo | `ClockIcon` | `text-navy` |
| Conquistas | `TrophyIcon` | `text-gold` |

Use `<CollectionTypeBadge type={collection.type} />`. Os labels PT-BR são exportados como `collectionTypeLabels` do mesmo arquivo.

Tipos `wishlist` aceitam **só items de wishlist** (com exceção do `was_wishlist=true` quando o user marca como adquirido — preserva o vínculo histórico). Outros tipos aceitam **só books**. A validação fica em `src/actions/addCollectionItem.ts`.

## Border lateral colorida em sub-cards

Padrão estabelecido em **leituras** dentro do detail do livro (`BookDetailClient.tsx:212-223` e `601`):
```tsx
const statusBorderClass = {
  reading: "border-l-gold",
  paused: "border-l-olive",
  finished: "border-l-moss",
  abandoned: "border-l-burgundy",
};

<li className={`rounded-md border border-border ${borderClass} border-l-[3px] bg-paper/40 p-4`}>
```
- `border-l-[3px]` arbitrary value pra ter 3px exato (não tem `border-l-3` no Tailwind)
- Resto da borda fica em `border-border` (cinza neutro)
- Background: `bg-paper/40` (4 0% paper sobre o ivory-light do Card pai)

Reuse este padrão para listas de releituras, leituras de série, itens de collection com status, etc.

## Hover dourado em cards interativos

Padrão estabelecido em `BookCard/index.tsx:53-58`:
```tsx
<div
  className={clsx(
    "relative group rounded-lg p-2 -m-2",
    "border border-transparent transition-colors duration-150",
    "hover:border-gold",
  )}
>
```
- `border border-transparent` reserva o espaço da borda mesmo invisível
- `hover:border-gold` aparece sem layout shift
- **Truque crucial**: `p-2 -m-2` cria um padding interno de 8px com margem negativa correspondente — afasta a borda visualmente do conteúdo sem deslocar nada no grid

Use sempre que um card de listagem for clicável e quiser feedback de hover. Não esqueça do `transition-colors duration-150`.

## Hover actions em cards / itens

Padrão de "ícones aparecem só em hover" — visto em BookCard, leituras do detail, citações:
```tsx
<div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
  <button aria-label="Editar"><PencilSquareIcon className="w-4 h-4" /></button>
  <button aria-label="Excluir"><TrashIcon className="w-4 h-4" /></button>
</div>
```
- Pai com `group` + `relative`
- Ícones em `text-ink-soft hover:text-ink-deep` (editar) e `text-burgundy hover:bg-burgundy/10` (excluir)
- `group-focus-within` garante visibilidade quando navegando por teclado

## Lista de primitives

Todos em `src/components/ui/` e re-exportados de `src/components/ui/index.ts`. **Sempre importe via `@/components/ui`** quando puder.

| Primitive | Quando usar | Props principais |
|---|---|---|
| `Button` | Toda ação clicável (button/anchor/Link) | `variant: primary \| secondary \| ghost \| destructive \| accent-navy \| accent-moss \| accent-terracota`, `size: sm \| md \| lg`, `as: button \| a \| Link`, `loading`, `leftIcon`, `rightIcon`, `fullWidth` |
| `Badge` | Tag/pill estática colorida | `variant: gold \| moss \| olive \| burgundy \| navy \| terracota \| fade`, `size: sm \| md` |
| `StatusBadge` | Badge auto-mapeado de enum do banco | `kind: reading \| ownership`, `status`. Não tente reimplementar mapping; use isso. |
| `Card` | Container principal (seções de form, blocos de detail) | `variant: default \| surface`, `size: sm \| md \| lg`, `header`, `footer`. Use `default` (com sombra) na maioria; `surface` pra blocos chapados secundários. |
| `Input` | Todos os campos de texto/number/date/etc. | `label`, `helperText`, `errorText`, `leftIcon`, `rightIcon`. **Erro inline** vai em `errorText` (vira borda burgundy + texto vermelho). |
| `Textarea` | Campos longos (sinopse, resenha, descrição) | `label`, `helperText`, `errorText`. `min-h-32` por default. |
| `Select` | Dropdown nativo (com chevron desenhado) | `label`, `options: SelectOption[]`, `placeholder`, `helperText`, `errorText`. Pode passar `<option>` direto via `children`. |
| `PageHeader` | Topo de toda listagem | `title`, `subtitle`, `actions`. Aplica `border-b` + `mb-8`. |
| `FilterChip` | Pills filtráveis horizontais (toggle on/off) | `active`. Visual: ativo é `bg-ink-deep`, inativo é `bg-ivory-light` com hover paper. Diferente de `Badge` — chip é interativo. |
| `EmptyState` | Sempre que listagem retornar zero (vazio total OU vazio com filtro) | `title`, `description`, `action`, `icon`. Já vem centralizado com `py-16`. |
| `BookCoverFallback` | Placeholder de capa quando não há imagem | `title`, `size: sm \| md \| lg`. Cor varia pelo charCode da inicial — 5 cores rotacionadas. **Sempre use isso, nunca improvise**. |
| `ConfirmDialog` | Modal de confirmação (deletes principalmente) | `open`, `onClose`, `onConfirm`, `title`, `description`, `confirmLabel`, `cancelLabel`, `variant: default \| destructive`, `loading`. |
| `DataTable` | Tabela genérica com colunas/rows | `columns: DataTableColumn<T>[]`, `rows`, `rowKey`, `emptyState`. Hoje pouco usado — listagens novas usam grid de Card. |
| `AuthorMultiSelect` | Multiselect de autores com auto-create + similaridade | `value`, `onChange`, `hiddenFieldName`. Faz fetch em `/api/authors/search` com debounce 200ms. Detecta similaridade via `normalizeName` antes de criar duplicata. |
| `CategoryMultiSelect` | Multiselect de categorias (lista rígida + atalho pra criar via QuickCategoryModal) | `value`, `onChange`, `options: CategoryOption[]`, `hiddenFieldName`, `onValidationChange`. **Bloqueia submit se há texto digitado sem match exato**. |
| `SerieSelect` | Single-select de série com auto-create | `value`, `onChange`, `hiddenFieldName`. Mesmo padrão de busca + similaridade do AuthorMultiSelect, mas com cardinalidade 1 (limpa o input quando selecionado). |
| `CoverUpload` | Drag-drop de imagem com preview 2/3 | `initialUrl`, `name="cover"`, `removedFieldName="cover_removed"`, `fallbackTitle`. Renderiza `BookCoverFallback` enquanto não há imagem. Limita 5MB, JPG/PNG/WebP. |
| `BookshelfDecoration` | SVG decorativo (lombadas) usado no detail do livro quando `ownership_status === "owned"` | Apenas `className`. Não é interativo. |

## Modal genérico

`src/components/forms/Modal.tsx` — não está em `ui/` mas é reusado por todos os FormModals (`ReadingFormModal`, `QuoteFormModal`, `DisposeBookModal`, `QuickCategoryModal`).

- Mobile: full-screen (`h-screen`, sem rounded)
- Desktop: centralizado, `sm:rounded-lg`, `sm:max-h-[90vh]` rolável
- Sizes: `sm` (md), `md` (lg), `lg` (2xl)
- Body scroll lock ativo enquanto aberto
- Esc fecha; backdrop `bg-ink-deep/60 backdrop-blur-sm`

Use `Modal` (não `ConfirmDialog`) sempre que precisar de form dentro do modal. `ConfirmDialog` é só pra confirmar ação binária.

## Notas finais

- Tailwind v4 lê tokens só de `@theme` em `globals.css` — não há `tailwind.config.js`. Se a cor/fonte não está em `globals.css`, ela não existe como utility.
- Animations: praticamente todos os hovers usam `transition-colors duration-150`. Para opacidade, `transition-opacity duration-150` ou `duration-200`.
- Custom scrollbars: classe `custom-scrollbar` (`globals.css:77-91`) — use em containers internos roláveis (drawer de filtros, body de modal, dropdowns de multiselect).
- Selection highlight em texto é gold transparente (`globals.css:71-74`) — não mexer.
