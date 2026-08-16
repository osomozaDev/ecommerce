"use client";

import type { MouseEvent } from "react";
import type { Product } from "@/lib/commerce/types";
import { useWishlist } from "@/lib/wishlist/wishlist-context";
import { trackAddToWishlist } from "@/lib/analytics/track";

/**
 * Corazón de favoritos. Funciona también DENTRO de un <Link> (tarjetas):
 * el click no navega. Toggle optimista vía useWishlist().
 */
export function WishlistButton({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(product.handle);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!saved) trackAddToWishlist(product);
    toggle(product.handle);
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
      title={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={handleClick}
      className={`grid size-9 place-items-center rounded-full border border-line bg-bg/80 text-base backdrop-blur transition-colors hover:border-ink ${
        saved ? "text-brand" : "text-muted hover:text-ink"
      } ${className}`}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}
