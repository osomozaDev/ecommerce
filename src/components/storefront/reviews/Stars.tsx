/** Estrellas de valoración accesibles (el número va en aria-label). */
export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const filled = Math.round(rating);
  return (
    <span
      role="img"
      aria-label={`${rating} de 5`}
      className={`tracking-tight text-brand ${className}`}
    >
      {"★".repeat(filled)}
      <span className="opacity-30">{"★".repeat(5 - filled)}</span>
    </span>
  );
}
