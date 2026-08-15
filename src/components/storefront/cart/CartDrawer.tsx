"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Botón de carrito del header + drawer lateral. Igual que el resto del
 * carrito: todo pasa por useCart(), sin conocer Shopify.
 */
export function CartWidget() {
  const [open, setOpen] = useState(false);
  const { cart, updateItem, removeItem, isPending } = useCart();
  const count = cart?.totalQuantity ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm transition-colors hover:text-brand"
      >
        Carrito
        <span className="flex h-6 min-w-6 items-center justify-center rounded-button bg-ink px-1.5 text-xs font-medium text-bg tabular-nums">
          {count}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-label="Carrito"
            className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-bg shadow-2xl transition-opacity ${
              isPending ? "opacity-80" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-heading text-lg font-semibold">
                Tu carrito {count > 0 && `(${count})`}
              </h2>
              <button
                type="button"
                aria-label="Cerrar carrito"
                onClick={() => setOpen(false)}
                className="px-2 text-xl text-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            {!cart || cart.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-muted">Tu carrito está vacío.</p>
                <Link
                  href="/productos"
                  onClick={() => setOpen(false)}
                  className={buttonClasses("secondary")}
                >
                  Ver productos
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                  {cart.lines.map((line) => (
                    <li key={line.id} className="flex gap-3 py-4">
                      <Link
                        href={line.href}
                        onClick={() => setOpen(false)}
                        className="relative aspect-4/5 w-14 shrink-0 overflow-hidden rounded-base bg-surface"
                      >
                        {line.image && (
                          <Image
                            src={line.image.src}
                            alt={line.image.alt}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{line.productTitle}</p>
                            {line.variantTitle && (
                              <p className="text-xs text-muted">{line.variantTitle}</p>
                            )}
                          </div>
                          <span className="text-sm tabular-nums">
                            {line.lineTotal.formatted}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-button border border-line text-sm">
                            <button
                              type="button"
                              aria-label="Reducir cantidad"
                              onClick={() => updateItem(line.id, line.quantity - 1)}
                              className="px-2.5 py-1 text-muted hover:text-ink"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center tabular-nums">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Aumentar cantidad"
                              onClick={() => updateItem(line.id, line.quantity + 1)}
                              className="px-2.5 py-1 text-muted hover:text-ink"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(line.id)}
                            className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 border-t border-line p-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-medium tabular-nums">
                      {cart.subtotal.formatted}
                    </span>
                  </div>
                  <a href={cart.checkoutUrl} className={buttonClasses("primary", "w-full")}>
                    Finalizar compra
                  </a>
                  <Link
                    href="/carrito"
                    onClick={() => setOpen(false)}
                    className={buttonClasses("ghost", "w-full")}
                  >
                    Ver carrito completo
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
