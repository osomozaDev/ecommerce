"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export function CartIndicator() {
  const { cart } = useCart();
  const count = cart?.totalQuantity ?? 0;
  return (
    <Link
      href="/carrito"
      className="flex items-center gap-2 text-sm transition-colors hover:text-brand"
    >
      Carrito
      <span className="flex h-6 min-w-6 items-center justify-center rounded-button bg-ink px-1.5 text-xs font-medium text-bg tabular-nums">
        {count}
      </span>
    </Link>
  );
}
