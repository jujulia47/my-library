/**
 * Quadrinhos/HQ são tratados SEPARADO de livros em todas as contagens.
 * Um livro é "quadrinho" quando tem alguma categoria de HQ/quadrinhos.
 */
export function isComicCategory(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return n === "hq" || n.includes("quadrinho") || n.includes("graphic novel");
}

/** true se o livro tem alguma categoria de quadrinhos/HQ. */
export function isComicBook(
  categoryNames: (string | null | undefined)[],
): boolean {
  return categoryNames.some(isComicCategory);
}
