"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AuthorInteractionContextValue = {
  /** ID do livro destacado no momento (vem de hover na lista de leituras,
   *  consumido pelo timeline pra dar zoom/glow). Null = nenhum hover. */
  hoveredBookId: string | null;
  setHoveredBookId: (id: string | null) => void;
};

const AuthorInteractionContext =
  createContext<AuthorInteractionContextValue | null>(null);

/**
 * Wrap em volta de sessões "Histórico de leitura" + "Bibliografia" na page
 * do autor pra elas se comunicarem via hover. Sem isso, o highlight cross-
 * componente exigiria prop-drilling ou store global — context fica isolado
 * só nessa página, leve.
 */
export function AuthorInteractionProvider({ children }: { children: ReactNode }) {
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);
  return (
    <AuthorInteractionContext.Provider
      value={{ hoveredBookId, setHoveredBookId }}
    >
      {children}
    </AuthorInteractionContext.Provider>
  );
}

/** Retorna o context. Quando usado fora do provider, devolve no-op pra
 *  componentes não quebrarem em outros contextos (ex.: testes). */
export function useAuthorInteraction(): AuthorInteractionContextValue {
  const ctx = useContext(AuthorInteractionContext);
  if (!ctx) {
    return {
      hoveredBookId: null,
      setHoveredBookId: () => {},
    };
  }
  return ctx;
}
