import "server-only";
import { cookies } from "next/headers";

/**
 * Wishlist: lista de handles de producto en una cookie httpOnly. Sin backend
 * propio ni Shopify: es estado del visitante, como el carrito. La lectura
 * vive aquí (Server Components); la escritura, en actions.ts.
 */

export const WISHLIST_COOKIE = "wishlist";
export const WISHLIST_MAX = 100;

export function parseWishlist(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((h): h is string => typeof h === "string" && /^[a-z0-9-]+$/i.test(h))
      .slice(0, WISHLIST_MAX);
  } catch {
    return [];
  }
}

export async function readWishlist(): Promise<string[]> {
  return parseWishlist((await cookies()).get(WISHLIST_COOKIE)?.value);
}
