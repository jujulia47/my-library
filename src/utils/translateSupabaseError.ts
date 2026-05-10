import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Mapa de constraint name → mensagem amigável + campo do form a destacar.
 * As chaves são substrings que aparecem na `message` retornada pelo Postgres
 * quando o constraint dispara. `field` é opcional: presente quando a violação
 * mapeia direto pra um único input do form, ausente em checks cross-field
 * ou erros que abrangem o registro inteiro.
 */
const ERROR_MAP: Record<string, { message: string; field?: string }> = {
  // Unique constraints — cada um aponta pro input que o usuário pode corrigir
  book_user_isbn_unique: {
    message: "Você já tem um livro cadastrado com esse ISBN.",
    field: "isbn",
  },
  book_user_slug_key: {
    message: "Você já tem um livro com esse título.",
    field: "title",
  },
  author_user_slug_key: {
    message: "Esse autor já existe na sua lista.",
    field: "name",
  },
  category_user_slug_key: {
    message: "Você já tem uma categoria com esse nome.",
    field: "name",
  },
  serie_user_slug_key: {
    message: "Você já tem uma série com esse nome.",
    field: "name",
  },
  collection_user_slug_key: {
    message: "Você já tem uma coleção com esse nome.",
    field: "name",
  },
  collection_item_unique_book: {
    message: "Esse livro já está nessa coleção.",
    field: "book_id",
  },
  collection_item_unique_wishlist: {
    message: "Esse item de wishlist já está nessa coleção.",
  },
  collection_item_exactly_one: {
    message: "Item inválido — deve ser um livro OU um item de wishlist.",
  },
  wishlist_user_slug_key: {
    message: "Você já tem esse livro na wishlist.",
    field: "title",
  },
  // Quote: slug é gerado a partir do excerpt + UUID — colisão é praticamente
  // impossível e, se acontecer, não é culpa de um campo específico.
  quote_user_slug_key: {
    message: "Essa citação já existe.",
  },

  // Check constraints (cross-field — sem `field`)
  book_check: {
    message: "A data de doação não pode ser anterior à data de aquisição.",
  },
  reading_check: {
    message: "A data de fim não pode ser anterior à data de início.",
  },
  serie_check: {
    message: "A data de fim não pode ser anterior à data de início.",
  },
  collection_check: {
    message: "A data de fim não pode ser anterior à data de início.",
  },

  // Check constraints com field associado
  reading_event_date_not_future: {
    message: "A data do evento não pode ser no futuro.",
    field: "event_date",
  },
  author_birth_year_valid: {
    message: "Ano de nascimento inválido.",
    field: "birth_year",
  },
  author_death_year_valid: {
    message: "Ano de morte inválido.",
    field: "death_year",
  },
  author_birth_before_death: {
    message: "Ano de nascimento deve ser anterior ao ano de morte.",
    field: "death_year",
  },
  author_bibliography_year_valid: {
    message: "Ano de publicação inválido.",
    field: "publication_year",
  },
  author_bibliography_unique_title: {
    message: "Esse autor já tem uma obra com esse título.",
    field: "title",
  },
};

type ErrorLike =
  | PostgrestError
  | { message?: string | null; code?: string | null }
  | null
  | undefined;

export type TranslatedError = {
  message: string;
  field?: string;
};

export function translateSupabaseError(error: ErrorLike): TranslatedError {
  if (!error) return { message: "Algo deu errado. Tente novamente." };

  const message = error.message ?? "";

  for (const [constraintName, friendly] of Object.entries(ERROR_MAP)) {
    if (message.includes(constraintName)) return { ...friendly };
  }

  const code = "code" in error ? error.code : undefined;
  if (code === "23505") return { message: "Esse registro já existe." };
  if (code === "23503")
    return {
      message: "Não foi possível salvar — alguma referência está faltando.",
    };
  if (code === "23514")
    return {
      message: "Algum valor está fora do permitido. Verifique os campos.",
    };

  return { message: "Algo deu errado ao salvar. Tente novamente em instantes." };
}

/**
 * Resultado padrão das actions. `field` aponta o input do form a destacar com
 * o erro inline; `code` permite ramificar comportamento (ex: validação de
 * domínio em markBookDisposed). Ambos opcionais — actions sem associação
 * óbvia retornam apenas `message` e a UI usa banner genérico.
 */
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string; field?: string; code?: string };
