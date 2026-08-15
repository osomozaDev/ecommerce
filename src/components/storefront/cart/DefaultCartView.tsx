"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { trackBeginCheckout, trackRemoveFromCart } from "@/lib/analytics/track";
import { LinkButton, buttonClasses } from "@/components/ui/Button";

/**
 * Vista de carrito completa. Todo pasa por useCart(): esta UI no sabe si
 * detrás hay Shopify o fixtures. "Finalizar compra" navega al checkout de
 * Shopify (cart.checkoutUrl): nunca hay checkout propio.
 */
export function DefaultCartView() {
  const { cart, updateItem, removeItem, isPending } = useCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg">Tu carrito está vacío.</p>
        <LinkButton href="/productos" variant="secondary">
          Ver productos
        </LinkButton>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-10 transition-opacity lg:grid-cols-[1fr_20rem] ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <ul className="flex flex-col divide-y divide-line">
        {cart.lines.map((line) => (
          <li key={line.id} className="flex gap-4 py-5">
            <Link
              href={line.href}
              className="relative aspect-4/5 w-20 shrink-0 overflow-hidden rounded-base bg-surface"
            >
              {line.image && (
                <Image
                  src={line.image.src}
                  alt={line.image.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={line.href} className="text-sm font-medium hover:underline">
                    {line.productTitle}
                  </Link>
                  {line.variantTitle && (
                    <p className="text-xs text-muted">{line.variantTitle}</p>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {line.lineTotal.formatted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-button border border-line">
                  <button
                    type="button"
                    aria-label="Reducir cantidad"
                    onClick={() => updateItem(line.id, line.quantity - 1)}
                    className="px-3 py-1.5 text-muted hover:text-ink"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    onClick={() => updateItem(line.id, line.quantity + 1)}
                    className="px-3 py-1.5 text-muted hover:text-ink"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    trackRemoveFromCart(line);
                    removeItem(line.id);
                  }}
                  className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="flex h-fit flex-col gap-4 rounded-base bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="font-heading text-lg font-semibold">Resumen</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{cart.subtotal.formatted}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{cart.total.formatted}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted">
          Envío e impuestos se calculan en el checkout.
        </p>
        <a
          href={cart.checkoutUrl}
          onClick={() => trackBeginCheckout(cart)}
          className={buttonClasses("primary", "w-full")}
        >
          Finalizar compra
        </a>
      </aside>
    </div>
  );
}
