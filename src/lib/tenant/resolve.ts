import "server-only";
import type { TenantConfig } from "./types";
import { defaultTenant } from "@/config/tenants/default";
import { tiendaB } from "@/config/tenants/tienda-b";

const tenants: Record<string, TenantConfig> = {
  [defaultTenant.id]: defaultTenant,
  [tiendaB.id]: tiendaB,
};

/**
 * Resolución de tenant. Fase 1: un tenant por despliegue, seleccionado con
 * TENANT_ID. La firma y el registro ya soportan la evolución futura:
 * resolver por dominio de la request (middleware/headers) sin tocar la UI.
 */
export function getTenant(): TenantConfig {
  const id = process.env.TENANT_ID ?? "default";
  const tenant = tenants[id];
  if (!tenant) {
    throw new Error(
      `Tenant desconocido: "${id}". Registrados: ${Object.keys(tenants).join(", ")}`,
    );
  }
  return tenant;
}
