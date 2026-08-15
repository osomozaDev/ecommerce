"use client";

import {
  createContext,
  useCallback,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Cart } from "@/lib/commerce/types";
import {
  addItemAction,
  removeItemAction,
  updateItemAction,
} from "./actions";

/**
 * Estado de carrito para la UI. La UI solo conoce esto:
 *   const { cart, addItem, updateItem, removeItem, isPending } = useCart();
 * Detrás: Server Actions → provider (Shopify o fixtures). Con useOptimistic,
 * cantidades y totales de líneas responden al instante mientras el servidor confirma.
 */

interface CartContextValue {
  cart: Cart | null;
  isPending: boolean;
  addItem: (merchandiseId: string, quantity?: number) => void;
  updateItem: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

type OptimisticAction =
  | { type: "add"; quantity: number }
  | { type: "update"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string };

function optimisticReducer(cart: Cart | null, action: OptimisticAction): Cart | null {
  if (!cart) {
    // Aún no hay carrito: el "add" optimista no puede inventar la línea
    // (no conoce el producto aquí); isPending cubre ese primer añadido.
    return cart;
  }
  switch (action.type) {
    case "add":
      return { ...cart, totalQuantity: cart.totalQuantity + action.quantity };
    case "update": {
      const lines = cart.lines.map((l) =>
        l.id === action.lineId ? { ...l, quantity: action.quantity } : l,
      );
      return {
        ...cart,
        lines,
        totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
      };
    }
    case "remove": {
      const lines = cart.lines.filter((l) => l.id !== action.lineId);
      return {
        ...cart,
        lines,
        totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
      };
    }
  }
}

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: Cart | null;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [isPending, startTransition] = useTransition();
  const [optimisticCart, applyOptimistic] = useOptimistic(cart, optimisticReducer);

  const run = useCallback(
    (optimistic: OptimisticAction, mutate: () => Promise<Cart>) => {
      startTransition(async () => {
        applyOptimistic(optimistic);
        try {
          setCart(await mutate());
        } catch (error) {
          // La UI vuelve sola al último estado confirmado al acabar la transición.
          console.error("Operación de carrito fallida:", error);
        }
      });
    },
    [applyOptimistic],
  );

  const addItem = useCallback(
    (merchandiseId: string, quantity = 1) =>
      run({ type: "add", quantity }, () => addItemAction(merchandiseId, quantity)),
    [run],
  );

  const updateItem = useCallback(
    (lineId: string, quantity: number) =>
      run({ type: "update", lineId, quantity }, () => updateItemAction(lineId, quantity)),
    [run],
  );

  const removeItem = useCallback(
    (lineId: string) =>
      run({ type: "remove", lineId }, () => removeItemAction(lineId)),
    [run],
  );

  return (
    <CartContext.Provider
      value={{ cart: optimisticCart, isPending, addItem, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider> (ver el layout del storefront)");
  }
  return ctx;
}
