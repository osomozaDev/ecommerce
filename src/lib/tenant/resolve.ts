import "server-only";
import { headers } from "next/headers";
import type { TenantConfig } from "./types";
import { resolveTenantByHost, tenantRegistry } from "./registry";

/**
 * Resolución de tenant por request:
 *   1. Por Host de la petición (multi-tenant real: N dominios → 1 deploy).
 *   2. Fallback a TENANT_ID (build estático, despliegues de un solo tenant,
 *      tests y contextos sin request).
 */
export async function getTenant(): Promise<TenantConfig> {
  const registry = await tenantRegistry();

  let host: string | null = null;
  try {
    host = (await headers()).get("host");
  } catch {
    // Fuera de una request (p. ej. prerender estático): se usa el fallback.
  }

  const byHost = resolveTenantByHost(host, registry.values());
  if (byHost) return byHost;

  const id = process.env.TENANT_ID ?? "default";
  const tenant = registry.get(id);
  if (!tenant) {
    throw new Error(
      `Tenant desconocido: "${id}". Registrados: ${[...registry.keys()].join(", ")}`,
    );
  }
  return tenant;
}

/** Busca un tenant por el dominio de su tienda Shopify (webhooks). */
export async function getTenantByStoreDomain(
  storeDomain: string,
): Promise<TenantConfig | null> {
  for (const tenant of (await tenantRegistry()).values()) {
    if (tenant.shopify.storeDomain === storeDomain) return tenant;
  }
  return null;
}
