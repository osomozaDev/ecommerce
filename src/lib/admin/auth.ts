import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Autenticación de la consola /admin: una clave única en el env ADMIN_SECRET
 * (nunca en el repo). La cookie de sesión guarda un token DERIVADO (sha256),
 * no la clave, y todas las comparaciones son en tiempo constante.
 */

export const ADMIN_COOKIE = "admin_session";

export function adminSecretConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET);
}

function derivedToken(): string | null {
  const secret = process.env.ADMIN_SECRET;
  return secret ? createHash("sha256").update(secret).digest("hex") : null;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** ¿La clave tecleada es la buena? (para el login) */
export function verifyAdminSecret(candidate: string): boolean {
  const token = derivedToken();
  if (!token) return false;
  return safeEqual(createHash("sha256").update(candidate).digest("hex"), token);
}

/** Token que va en la cookie tras un login correcto. */
export function adminCookieToken(): string | null {
  return derivedToken();
}

export async function isAdminAuthed(): Promise<boolean> {
  const token = derivedToken();
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(token && value && safeEqual(value, token));
}
