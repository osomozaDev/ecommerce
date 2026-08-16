import { Container } from "@/components/ui/Container";
import { Stars } from "./Stars";
import type { ReviewsProps } from "./types";

/** Listado de reseñas bajo la ficha de producto. Sin reseñas no ocupa nada. */
export function DefaultReviews({ reviews }: ReviewsProps) {
  if (reviews.count === 0) return null;

  return (
    <section aria-label="Reseñas">
      <Container className="border-t border-line py-10">
        <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Reseñas</h2>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Stars rating={reviews.averageRating} />
            {reviews.averageRating} · {reviews.count}{" "}
            {reviews.count === 1 ? "reseña" : "reseñas"}
          </p>
        </div>

        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.reviews.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-3 rounded-base border border-line bg-surface p-6"
            >
              <Stars rating={review.rating} className="text-sm" />
              {review.title && <h3 className="font-medium">{review.title}</h3>}
              <p className="flex-1 text-sm leading-relaxed text-muted">{review.body}</p>
              <p className="text-xs text-muted">
                {review.author}
                {review.date && ` — ${review.date}`}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
