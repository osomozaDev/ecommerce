/**
 * Índice de tenants. Cada tienda es un JSON en este directorio.
 * El CLI de provisioning (scripts/nueva-tienda.mjs) añade aquí la línea
 * de import automáticamente: alta de tienda = configuración, no código.
 */
import defaultTenant from "./default.json";
import tiendaB from "./tienda-b.json";

export const tenantData: unknown[] = [defaultTenant, tiendaB];
