"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist/wishlist-context";

/** Enlace a /favoritos en el header, con contador en vivo. */
export function WishlistLink() {
  const { count } = useWishlist();
  return (
    <Link
      href="/favoritos"
      aria-label={`Favoritos${count > 0 ? ` (${count})` : ""}`}
      className="text-sm text-muted transition-colors hover:text-ink"
    >
      Favoritos{count > 0 && ` (${count})`}
    </Link>
  );
}
