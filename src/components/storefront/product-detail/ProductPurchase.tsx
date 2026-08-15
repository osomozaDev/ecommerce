"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/commerce/types";
import { useCart } from "@/lib/cart/cart-context";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";

/**
 * Selector de opciones + cantidad + añadir al carrito.
 * Único punto interactivo de la ficha de producto: recibe el Product ya
 * normalizado y habla con el carrito solo a través de useCart().
 */
export function ProductPurchase({ product }: { product: Product }) {
  const { addItem, isPending } = useCart();

  const initialVariant =
    product.variants.find((v) => v.available) ?? product.variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialVariant?.selectedOptions.map((o) => [o.name, o.value]) ?? [],
    ),
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  const variant = useMemo(
    () =>
      product.variants.find((v) =>
        v.selectedOptions.every((o) => selected[o.name] === o.value),
      ),
    [product.variants, selected],
  );

  const canBuy = Boolean(variant?.available);
  const hasRealOptions =
    product.options.length > 0 &&
    !(product.options.length === 1 && product.options[0].values.length === 1);

  function handleAdd() {
    if (!variant) return;
    addItem(variant.id, quantity);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <Price
        price={variant?.price ?? product.price}
        compareAtPrice={variant?.compareAtPrice ?? product.compareAtPrice}
        className="text-2xl font-medium"
      />

      {hasRealOptions &&
        product.options.map((option) => (
          <fieldset key={option.name} className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{option.name}</legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const active = selected[option.name] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [option.name]: value }))
                    }
                    className={`rounded-button border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "border-ink bg-ink text-bg"
                        : "border-line text-ink hover:border-ink"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-button border border-line">
          <button
            type="button"
            aria-label="Reducir cantidad"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-muted hover:text-ink"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label="Aumentar cantidad"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="px-3 py-2 text-muted hover:text-ink"
          >
            +
          </button>
        </div>
        <Button
          onClick={handleAdd}
          disabled={!canBuy || isPending}
          className="flex-1"
        >
          {!canBuy ? "Agotado" : added ? "Añadido ✓" : "Añadir al carrito"}
        </Button>
      </div>
    </div>
  );
}
