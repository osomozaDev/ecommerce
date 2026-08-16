import "server-only";
import { headers } from "next/headers";
import type { TenantConfig } from "./types";
import { getTenant } from "./resolve";

/**
 * Mercado activo de la request (Shopify Markets). Se resuelve por Host,
 * con la misma mecánica que el tenant: un alias de dominio → un mercado.
 * Sin mercados configurados, el mercado por defecto usa el locale del
 * tenant y (si se define) su defaultCountry.
 */

export interface Market {
  id: string;
  /** CountryCode para @inContext; undefined = mercado por defecto de la tienda. */
  country?: string;
  /** LanguageCode para @inContext. */
  language: string;
  /** Locale de formateo de precios y fechas. */
  locale: string;
}

/** "es-ES" → "ES", "en-GB" → "EN" (subtag primario como LanguageCode). */
export function languageFromLocale(locale: string): string {
  return locale.split("-")[0].toUpperCase();
}

/** Resolución pura por hostname (testeable sin request). */
export function resolveMarket(host: string | null, tenant: TenantConfig): Market {
  const hostname = host?.split(":")[0].toLowerCase();
  const markets = tenant.markets?.markets ?? [];
  const match = hostname
    ? markets.find((m) => m.domains.some((d) => d.toLowerCase() === hostname))
    : undefined;
  if (match) {
    return {
      id: match.id,
      country: match.country,
      language: match.language ?? languageFromLocale(match.locale),
      locale: match.locale,
    };
  }
  return {
    id: "default",
    country: tenant.markets?.defaultCountry,
    language: languageFromLocale(tenant.locale),
    locale: tenant.locale,
  };
}

export async function getMarket(tenant?: TenantConfig): Promise<Market> {
  const t = tenant ?? (await getTenant());
  let host: string | null = null;
  try {
    host = (await headers()).get("host");
  } catch {
    // Fuera de una request: mercado por defecto.
  }
  return resolveMarket(host, t);
}
