import "server-only";
import { cookies } from "next/headers";

/**
 * Sesión de cliente en cookie httpOnly (los tokens jamás llegan al
 * navegador como JS-readable). La cookie guarda el JSON en base64url.
 * Escribir/borrar solo es posible en Route Handlers o Server Actions;
 * las páginas solo leen.
 */

export interface CustomerSession {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms en el que caduca el access token. */
  expiresAt: number;
  idToken?: string;
}

export const CUSTOMER_SESSION_COOKIE = "customer_session";

/** La cookie dura lo que el refresh token de Shopify (30 días renovables). */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function encodeSession(session: CustomerSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeSession(value: string): CustomerSession | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as CustomerSession;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** ¿El access token está caducado? (por-request; las páginas no llaman a Date.now). */
export function sessionIsExpired(session: CustomerSession): boolean {
  return session.expiresAt <= Date.now();
}

export async function readCustomerSession(): Promise<CustomerSession | null> {
  const value = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  return value ? decodeSession(value) : null;
}
