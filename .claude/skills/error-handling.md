# Error Handling — my-library

Toda comunicação de erro com o usuário deve ser em **PT-BR**, específica quando possível, e nunca expor mensagens cruas do Postgres/Supabase. O sistema de tradução central vive em `src/utils/translateSupabaseError.ts`.

## Contrato `ActionResult<T>` (referência rápida)

Definido em `src/utils/translateSupabaseError.ts`:
```ts
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string; field?: string; code?: string };
```

- **`message`** — string PT-BR pra mostrar ao usuário, sempre presente em erro.
- **`field?`** — nome do `name` do input do form a destacar com erro inline. Presente quando a violação mapeia direto pra um único campo (`isbn`, `title`, `name`, etc.). Ausente em validações cross-field (`book_check`, `reading_check`) ou erros genéricos.
- **`code?`** — discriminator opcional pra ramificação de UI. Hoje só `markBookDisposed` usa (`code: "invalid_dates"` → mostra inline no campo de data; `code: "invalid_input"` → banner). Adicionar mais códigos só quando há comportamento de UI distinto a justificar.

**Toda action retorna esse shape**, exceto:
- `uploadImage` (helper interno, lança Error com message — chamada por server actions, não direto pelo client)
- `createAuthor`, `createSerieMinimal` (precisam retornar id em sucesso → variantes `{ ok: true; id; name } | { ok: false; message }`; usam só `.message` da tradução, sem field)
- Actions com `redirect()` em sucesso (`createBookMinimal`, `updateBookFull`) — retornam `Promise<ActionResult>` e em sucesso chamam `redirect()`, que lança `NEXT_REDIRECT` interceptado pelo Next. Cliente filtra a mensagem `NEXT_REDIRECT` no catch (ver "Padrão no client" abaixo).

## `translateSupabaseError`

Recebe qualquer erro estilo `PostgrestError` ou `{ message, code }` e retorna `{ message: string; field?: string }`.

### Estratégia
1. Procura **substring de constraint name** dentro de `error.message` — match retorna `{ message, field? }` específicos
2. Fallback para `code` SQL conhecido:
   - `23505` → "Esse registro já existe." (sem field)
   - `23503` → "Não foi possível salvar — alguma referência está faltando."
   - `23514` → "Algum valor está fora do permitido. Verifique os campos."
3. Catchall genérico: "Algo deu errado ao salvar. Tente novamente em instantes."

### `ERROR_MAP` atual

Mapa em `translateSupabaseError.ts`. Constraints atuais com mensagem e campo a destacar:

| Constraint | Mensagem PT-BR | Field |
|---|---|---|
| `book_user_isbn_unique` | Você já tem um livro cadastrado com esse ISBN. | `isbn` |
| `book_user_slug_key` | Você já tem um livro com esse título. | `title` |
| `author_user_slug_key` | Esse autor já existe na sua lista. | `name` |
| `category_user_slug_key` | Essa categoria já existe na sua lista. | `name` |
| `serie_user_slug_key` | Essa série já existe na sua lista. | `name` |
| `collection_user_slug_key` | Essa coleção já existe. | `name` |
| `quote_user_slug_key` | Essa citação já existe. | — |
| `book_check` | A data de doação não pode ser anterior à data de aquisição. | — (cross-field) |
| `reading_check` | A data de fim não pode ser anterior à data de início. | — (cross-field) |
| `serie_check` | A data de fim não pode ser anterior à data de início. | — (cross-field) |
| `collection_check` | A data de fim não pode ser anterior à data de início. | — (cross-field) |

`quote_user_slug_key` não tem `field` porque o slug de quote é gerado a partir de excerpt + UUID — colisão é praticamente impossível e, se acontecer, não é culpa de um campo específico.

### Adicionando novo constraint

Quando aparecer um constraint não mapeado em produção:
1. Capture o `error` cru via `console.error` em dev (ou Network tab)
2. O `message` do Postgres tem o nome do constraint — substring é suficiente (ex.: `duplicate key value violates unique constraint "book_user_isbn_unique"`)
3. Adicione entrada ao `ERROR_MAP` com `message` e, se aplicável, `field` apontando pro `name` do input do form
4. Confira que a constraint existe de fato no schema (ver migrations em `supabase/migrations/`)

Convenção: nome do constraint deve refletir a regra. Migrations já criam constraints com nomes explícitos como `book_user_isbn_unique`, `book_user_slug_key`, etc.

### Pattern de uso na action

Sempre fazer **spread** do resultado de `translateSupabaseError` para propagar `field`:
```ts
if (error) return { ok: false, ...translateSupabaseError(error) };
```
Não fazer `{ ok: false, message: translateSupabaseError(error) }` — isso descartaria `field`.

## Padrão de uso no client

### Form padrão (action retorna `ActionResult` direto)

```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
const [genericError, setGenericError] = useState<string | null>(null);

const onSubmit = (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  setFieldErrors({});
  setGenericError(null);
  startTransition(async () => {
    const result = await action(fd);
    if (!result.ok) {
      if (result.field) {
        setFieldErrors({ [result.field]: result.message });
      } else {
        setGenericError(result.message);
      }
      return;
    }
    router.refresh();
    onClose();
  });
};
```

### Form com redirect em sucesso (`createBookMinimal`, `updateBookFull`)

```tsx
startTransition(async () => {
  try {
    const result = await action(fd);
    if (result && !result.ok) {
      if (result.field) {
        setFieldErrors({ [result.field]: result.message });
      } else {
        setGenericError(result.message);
      }
    }
  } catch (err) {
    // redirect() lança NEXT_REDIRECT em sucesso — Next intercepta. Filtra.
    if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
      setGenericError(err.message);
    }
  }
});
```

### Renderização

- **Inline no campo**: passar `errorText={fieldErrors.<name>}` no `Input`/`Textarea`/`Select` correspondente (o `name` do input bate com o `field` retornado). Borda fica burgundy automaticamente, mensagem aparece abaixo do input.
- **Banner acima do form**: renderizar bloco `bg-burgundy/10 border-burgundy/30` quando `genericError` está setado:
```tsx
{genericError && (
  <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
    {genericError}
  </p>
)}
```

Forms já adotando o padrão: `BookMinimal.tsx`, `BookFull.tsx`, `ReadingFormModal.tsx`, `QuoteFormModal.tsx`, `QuickCategoryModal.tsx`, `CategoryForm.tsx`, `DisposeBookModal.tsx`.

## Erros de domínio (ramificação por `code`)

`markBookDisposed` em `createQuoteForBook.ts` usa `code` pra distinguir tipo de erro:
- `code: "invalid_dates"` + `field: "disposed_date"` → data inválida ou anterior à aquisição → UI mostra inline no `Input` de data
- `code: "invalid_input"` → erro genérico (auth, livro inválido, falha do banco) → UI mostra em banner

Cliente:
```tsx
const result = await markBookDisposed(fd);
if (!result.ok) {
  if (result.code === "invalid_dates") {
    setDateError(result.message);
  } else {
    setGenericError(result.message);
  }
}
```

Adicione `code` só quando a UI realmente precisa ramificar. Se basta `field`, fique com `field`.

## Mensagens de "campo obrigatório"

Validar no client (HTML5 `required`) E no server. No server, retornar mensagem específica com `field` quando aplicável:
```ts
if (!title)
  return { ok: false, message: "Título obrigatório.", field: "title" };
if (!book_id) return { ok: false, message: "Livro inválido." };  // sem field — não há input de book_id no form
```

Mensagens curtas, em PT-BR, com ponto final.

## Auth check em toda action

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { ok: false, message: "Não autenticado." };
```

Não confie só em RLS — RLS bloqueia mas a mensagem retornada vai ser de constraint, não de auth. Verificar `user` antes deixa a mensagem específica.

## Resumo do contrato

- **Toda action**: usa `translateSupabaseError` e faz spread (`...translateSupabaseError(error)`) pra propagar `field`
- **Action que precisa redirect em sucesso** → retorna `ActionResult` em erro, `redirect()` em sucesso (cliente usa try/catch + filtro `NEXT_REDIRECT`)
- **Mensagens** sempre em PT-BR, curtas, específicas, sem código nem nome técnico
- **Constraints novas** no schema → atualizar `ERROR_MAP` na sessão em que forem adicionadas, incluindo `field` se aplicável
- **`code`** apenas quando a UI ramifica comportamento — não jogue por reflexo
