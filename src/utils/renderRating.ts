export const renderRating = (rating: number | null) => {
  if (rating === null) return null;
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
};