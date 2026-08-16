import type { ProductReviews, Review } from "./types";

/** Agregado de reseñas (media a 1 decimal). Puro y compartido por ambos providers. */
export function summarizeReviews(reviews: Review[]): ProductReviews {
  const count = reviews.length;
  const averageRating =
    count === 0
      ? 0
      : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10;
  return { averageRating, count, reviews };
}
