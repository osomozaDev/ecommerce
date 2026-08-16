import "server-only";
import { cookies } from "next/headers";
import { CONSENT_COOKIE, type ConsentValue } from "./consent";

/** Decisión de consentimiento de la request actual (null = aún no ha elegido). */
export async function getConsent(): Promise<ConsentValue | null> {
  const value = (await cookies()).get(CONSENT_COOKIE)?.value;
  return value === "granted" || value === "denied" ? value : null;
}
