import type { Money } from "@/lib/commerce/types";

/** Muestra un precio ya formateado por el dominio. La UI nunca formatea importes. */
export function Price({
  price,
  compareAtPrice,
  className = "",
}: {
  price: Money;
  compareAtPrice?: Money;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span>{price.formatted}</span>
      {compareAtPrice && (
        <s className="text-muted text-[0.85em]">{compareAtPrice.formatted}</s>
      )}
    </span>
  );
}
