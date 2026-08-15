import "server-only";
import { getTenant } from "@/lib/tenant/resolve";

/**
 * Cliente GraphQL mínimo para la Shopify Storefront API.
 * - Solo server: `server-only` rompe el build si un Client Component lo importa.
 * - El token NUNCA sale del servidor (env sin NEXT_PUBLIC_).
 * - Caché vía las primitivas de Next: `revalidate` + `tags`, de modo que en el
 *   futuro un webhook de Shopify podrá invalidar con revalidateTag().
 */

const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-10";

interface ShopifyFetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  /** Tags de caché de Next para invalidación selectiva. */
  tags?: string[];
  /** Segundos de revalidación. Ignorado si cache: "no-store". */
  revalidate?: number;
  /** "no-store" para datos por-usuario (carrito). */
  cache?: "no-store";
}

export async function shopifyFetch<T>({
  query,
  variables,
  tags,
  revalidate = 300,
  cache,
}: ShopifyFetchOptions): Promise<T> {
  const tenant = getTenant();
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!token) {
    throw new Error(
      "SHOPIFY_STOREFRONT_TOKEN no está definido. Añádelo a .env.local o usa COMMERCE_DATA_SOURCE=fixtures.",
    );
  }

  const endpoint = `https://${tenant.shopify.storeDomain}/api/${API_VERSION}/graphql.json`;
  // Shopify distingue el tipo de token por cabecera: los privados (shpss_…,
  // canal Headless) van en Shopify-Storefront-Private-Token; los públicos
  // (hex de custom app) en X-Shopify-Storefront-Access-Token.
  const authHeader: Record<string, string> = token.startsWith("shpss_")
    ? { "Shopify-Storefront-Private-Token": token }
    : { "X-Shopify-Storefront-Access-Token": token };
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
    throw new Error(`Shopify respondió ${res.status} en ${tenant.shopify.storeDomain}`);
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

/** Tags de caché usados por el provider Shopify. */
export const CACHE_TAGS = {
  products: "products",
  product: (handle: string) => `product:${handle}`,
  collections: "collections",
  collection: (handle: string) => `collection:${handle}`,
} as const;
