"use server";

import { cookies } from "next/headers";
import { readWishlist, WISHLIST_COOKIE, WISHLIST_MAX } from "./read";

const WISHLIST_MAX_AGE = 60 * 60 * 24 * 180;

/** Añade o quita un handle. Devuelve la lista resultante (la UI se reconcilia). */
export async function toggleWishlistAction(handle: string): Promise<string[]> {
  if (typeof handle !== "string" || !/^[a-z0-9-]+$/i.test(handle)) {
    throw new Error(`Handle inválido: ${String(handle)}`);
  }
  const current = await readWishlist();
  const next = current.includes(handle)
    ? current.filter((h) => h !== handle)
    : [...current, handle].slice(-WISHLIST_MAX);

  (await cookies()).set(WISHLIST_COOKIE, JSON.stringify(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WISHLIST_MAX_AGE,
  });
  return next;
}
