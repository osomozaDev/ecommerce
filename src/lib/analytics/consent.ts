import type { TenantConfig } from "@/lib/tenant/types";

/**
 * Consentimiento de cookies (RGPD). La decisión vive en una cookie legible
 * por el servidor: AnalyticsScripts solo inyecta vendors con consentimiento
 * concedido, y el banner solo aparece si el tenant tiene algún vendor
 * configurado (sin vendors no hay transferencia a terceros que consentir:
 * los eventos de dataLayer son first-party).
 *
 * Este módulo es client-safe: el lado servidor está en consent-server.ts.
 */

export type ConsentValue = "granted" | "denied";

export const CONSENT_COOKIE = "cookie_consent";

/** La decisión caduca a los 180 días: se vuelve a preguntar. */
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export function setConsentClient(value: ConsentValue) {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax`;
}

/** ¿Este tenant carga algún script de terceros? Determina si hace falta banner. */
export function hasAnalyticsVendor(analytics: TenantConfig["analytics"]): boolean {
  return Boolean(analytics?.ga4MeasurementId || analytics?.plausibleDomain);
}
