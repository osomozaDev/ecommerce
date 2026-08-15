"use server";

import { cookies } from "next/headers";
import type { Cart } from "@/lib/commerce/types";
import { getCommerce } from "@/lib/commerce/provider";

/**
 * Server Actions del carrito: la ÚNICA vía por la que el cliente toca datos
 * de carrito. La UI llama a useCart() (lib/cart/cart-context.tsx), que llama
 * aquí; aquí se resuelve cookie + provider. Ninguna mutation llega a la UI.
 */

const CART_COOKIE = "cartId";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días, como el carrito de Shopify

function assertQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    throw new Error(`Cantidad inválida: ${quantity}`);
  }
}

async function readCartId(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value;
}

async function getOrCreateCartId(): Promise<string> {
  // La cookie puede traer un carrito expirado, ya comprado o de otro data
  // source (fixtures ↔ shopify): se valida antes de usarla y se regenera si no vale.
  const existing = await readCartId();
  if (existing) {
    try {
      if (await getCommerce().getCart(existing)) return existing;
    } catch {
      // id inválido para este data source: se crea uno nuevo
    }
  }
  const cart = await getCommerce().createCart();
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
  });
  return cart.id;
}

/** Carrito actual, o null si aún no existe. Seguro de llamar durante el render. */
export async function getCartAction(): Promise<Cart | null> {
  const cartId = await readCartId();
  if (!cartId) return null;
  try {
    return await getCommerce().getCart(cartId);
  } catch {
    // Cookie huérfana (carrito expirado o de otro data source): se ignora.
    return null;
  }
}

export async function addItemAction(
  merchandiseId: string,
  quantity = 1,
): Promise<Cart> {
  if (!merchandiseId) throw new Error("Falta merchandiseId");
  assertQuantity(quantity);
  const cartId = await getOrCreateCartId();
  return getCommerce().addCartLines(cartId, [{ merchandiseId, quantity }]);
}

export async function updateItemAction(
  lineId: string,
  quantity: number,
): Promise<Cart> {
  if (!lineId) throw new Error("Falta lineId");
  assertQuantity(quantity);
  const cartId = await readCartId();
  if (!cartId) throw new Error("No hay carrito activo");
  return getCommerce().updateCartLine(cartId, lineId, quantity);
}

export async function removeItemAction(lineId: string): Promise<Cart> {
  if (!lineId) throw new Error("Falta lineId");
  const cartId = await readCartId();
  if (!cartId) throw new Error("No hay carrito activo");
  return getCommerce().removeCartLines(cartId, [lineId]);
}
