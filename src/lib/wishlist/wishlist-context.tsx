"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { toggleWishlistAction } from "./actions";

/**
 * Estado de la wishlist en el cliente: toggle optimista al instante y
 * reconciliación con la respuesta de la Server Action (que es quien
 * persiste la cookie). Mismo espíritu que useCart().
 */

interface WishlistContextValue {
  handles: string[];
  count: number;
  has: (handle: string) => boolean;
  toggle: (handle: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  initialHandles,
  children,
}: {
  initialHandles: string[];
  children: ReactNode;
}) {
  const [handles, setHandles] = useState(initialHandles);
  const [, startTransition] = useTransition();

  const toggle = useCallback((handle: string) => {
    setHandles((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle],
    );
    startTransition(async () => {
      setHandles(await toggleWishlistAction(handle));
    });
  }, []);

  const has = useCallback((handle: string) => handles.includes(handle), [handles]);

  return (
    <WishlistContext.Provider value={{ handles, count: handles.length, has, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist requiere <WishlistProvider>");
  return context;
}
