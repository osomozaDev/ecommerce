import type { TenantConfig } from "./types";
import type { Block } from "@/blocks/types";
import { tenantData } from "@/config/tenants";
import { themes } from "@/config/themes";

/**
 * Hidrata y valida los JSON de tenant. Los JSON son datos (generables por
 * IA/CMS en el futuro); aquí se convierten en TenantConfig tipada:
 * - se valida lo imprescindible con errores claros;
 * - la referencia de theme ("theme-a") se resuelve contra config/themes;
 * - los bloques de tipo desconocido se descartan (una config más nueva
 *   no debe romper un storefront desplegado).
 */

const KNOWN_BLOCKS = new Set(["hero", "featuredCollection", "banner"]);

function fail(id: string, problem: string): never {
  throw new Error(`Tenant "${id}" inválido: ${problem}`);
}

export function hydrateTenant(raw: unknown): TenantConfig {
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" && t.id ? t.id : fail("(sin id)", "falta id");

  if (typeof t.domain !== "string" || !t.domain.startsWith("http")) {
    fail(id, "domain debe ser una URL con protocolo");
  }
  const shopify = t.shopify as { storeDomain?: string } | undefined;
  if (!shopify?.storeDomain?.endsWith(".myshopify.com")) {
    fail(id, "shopify.storeDomain debe ser xxx.myshopify.com");
  }
  const branding = t.branding as { name?: string } | undefined;
  if (!branding?.name) fail(id, "falta branding.name");

  const themeRef = t.theme;
  if (typeof themeRef !== "string" || !themes[themeRef]) {
    fail(id, `theme "${String(themeRef)}" no existe en config/themes (disponibles: ${Object.keys(themes).join(", ")})`);
  }

  const pages = (t.pages ?? {}) as { homepage?: { type?: string }[] };
  const homepage = (pages.homepage ?? []).filter(
    (b) => b && KNOWN_BLOCKS.has(b.type ?? ""),
  ) as Block[];

  const dataSource = t.dataSource;
  if (dataSource !== undefined && dataSource !== "shopify" && dataSource !== "fixtures") {
    fail(id, `dataSource inválido: "${String(dataSource)}" (usa "shopify" o "fixtures")`);
  }

  return {
    id,
    slug: typeof t.slug === "string" ? t.slug : id,
    domain: t.domain,
    dataSource: dataSource as TenantConfig["dataSource"],
    domains: Array.isArray(t.domains) ? (t.domains as string[]) : undefined,
    locale: typeof t.locale === "string" ? t.locale : "es-ES",
    branding: t.branding as TenantConfig["branding"],
    theme: themes[themeRef],
    pages: { homepage },
    shopify: { storeDomain: shopify.storeDomain },
  };
}

let cache: Map<string, TenantConfig> | null = null;

export function tenantRegistry(): Map<string, TenantConfig> {
  if (!cache) {
    cache = new Map(tenantData.map(hydrateTenant).map((t) => [t.id, t]));
  }
  return cache;
}

/** Resolución pura por hostname (testeable sin request). */
export function resolveTenantByHost(
  host: string | null,
  tenants: Iterable<TenantConfig>,
): TenantConfig | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  for (const tenant of tenants) {
    if (new URL(tenant.domain).hostname === hostname) return tenant;
    if (tenant.domains?.some((d) => d.toLowerCase() === hostname)) return tenant;
  }
  return null;
}
