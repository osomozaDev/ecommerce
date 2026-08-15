import "server-only";
import { getTenant } from "@/lib/tenant/resolve";
import type { TenantConfig } from "@/lib/tenant/types";

/**
 * Cliente GraphQL mínimo para la Shopify Storefront API.
 * - Solo server: `server-only` rompe el build si un Client Component lo importa.
 * - Los tokens NUNCA salen del servidor (env sin NEXT_PUBLIC_).
 * - Multi-tenant: cada tenant usa su propio token (convención de env por id)
 *   y sus propios tags de caché, de modo que N tiendas conviven en un deploy.
 * - Caché vía las primitivas de Next: `revalidate` + `tags`; los webhooks de
 *   Shopify invalidan con revalidateTag() (app/api/webhooks/shopify).
 */

const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-10";

/**
 * Secreto por tenant con fallback global:
 * SHOPIFY_STOREFRONT_TOKEN__TIENDA_B > SHOPIFY_STOREFRONT_TOKEN.
 * (id de tenant en mayúsculas, guiones → guiones bajos)
 */
export function tenantSecret(base: string, tenantId: string): string | undefined {
  const suffix = tenantId.toUpperCase().replace(/-/g, "_");
  return process.env[`${base}__${suffix}`] ?? process.env[base];
}

interface ShopifyFetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  /** Tags de caché de Next para invalidación selectiva. */
  tags?: string[];
  /** Segundos de revalidación. Ignorado si cache: "no-store". */
  revalidate?: number;
  /** "no-store" para datos por-usuario (carrito). */
  cache?: "no-store";
  /** Tenant ya resuelto (evita resolverlo dos veces); por defecto, el de la request. */
  tenant?: TenantConfig;
}

export async function shopifyFetch<T>({
  query,
  variables,
  tags,
  revalidate = 300,
  cache,
  tenant,
}: ShopifyFetchOptions): Promise<T> {
  const t = tenant ?? (await getTenant());
  const token = tenantSecret("SHOPIFY_STOREFRONT_TOKEN", t.id);
  if (!token) {
    throw new Error(
      `Falta el token Storefront del tenant "${t.id}": define SHOPIFY_STOREFRONT_TOKEN__${t.id.toUpperCase().replace(/-/g, "_")} (o SHOPIFY_STOREFRONT_TOKEN como fallback), o usa COMMERCE_DATA_SOURCE=fixtures.`,
    );
  }

  // Shopify distingue el tipo de token por cabecera: los privados (shpss_…,
  // canal Headless) van en Shopify-Storefront-Private-Token; los públicos
  // (hex de custom app) en X-Shopify-Storefront-Access-Token.
  const authHeader: Record<string, string> = token.startsWith("shpss_")
    ? { "Shopify-Storefront-Private-Token": token }
    : { "X-Shopify-Storefront-Access-Token": token };

  const endpoint = `https://${t.shopify.storeDomain}/api/${API_VERSION}/graphql.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify({ query, variables }),
    ...(cache === "no-store"
      ? { cache: "no-store" as const }
      : { next: { revalidate, tags } }),
  });

  if (!res.ok) {
    throw new Error(`Shopify respondió ${res.status} en ${t.shopify.storeDomain}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`Error GraphQL de Shopify: ${json.errors.map((e) => e.message).join(" | ")}`);
  }
  if (!json.data) {
    throw new Error("Respuesta de Shopify sin datos");
  }
  return json.data;
}

/** Tags de caché con namespace por tenant: invalidar una tienda no toca las demás. */
export const CACHE_TAGS = {
  products: (tenantId: string) => `t:${tenantId}:products`,
  product: (tenantId: string, handle: string) => `t:${tenantId}:product:${handle}`,
  collections: (tenantId: string) => `t:${tenantId}:collections`,
  collection: (tenantId: string, handle: string) => `t:${tenantId}:collection:${handle}`,
} as const;
