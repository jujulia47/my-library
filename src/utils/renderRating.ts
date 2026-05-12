/**
 * Renderização textual de rating em estrelas para contextos sem JSX
 * (titles/tooltips, busca, exports). Suporta meia-estrela: 2.5 vira
 * "★★½☆☆", 3 vira "★★★☆☆", etc.
 *
 * Pra rendering JSX com half-fill visual (overlay dourado), use o
 * componente `<RatingStars />` em `@/components/ui/RatingStars`.
 */
export const renderRating = (rating: number | null) => {
  if (rating === null) return null;
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return "★".repeat(full) + (hasHalf ? "½" : "") + "☆".repeat(empty);
};
