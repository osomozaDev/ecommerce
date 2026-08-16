import type { TenantConfig } from "./types";
import type { ComponentVariantMap, ThemeConfig, ThemeTokens } from "@/theme/types";
import type { Block } from "@/blocks/types";
import { tenantData } from "@/config/tenants";
import { themes } from "@/config/themes";

/**
 * Hidrata y valida los JSON de tenant. Los JSON son datos (generables por
 * IA/CMS); aquí se convierten en TenantConfig tipada:
 * - se valida lo imprescindible con errores claros;
 * - la referencia de theme ("theme-a") se resuelve contra config/themes;
 * - los bloques de tipo desconocido se descartan (una config más nueva
 *   no debe romper un storefront desplegado).
 *
 * FUENTES: los JSON del repo son la base. Si TENANTS_URL está definida,
 * se cargan además tenants remotos (mismo formato, un array JSON) que
 * PISAN a los del repo por id — editar una tienda deja de requerir deploy.
 * La URL se cachea con revalidate + tag "tenants"; POST /api/revalidate
 * fuerza la recarga inmediata.
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

  // themeOverrides (opcional): identidad visual propia SIN crear un archivo de
  // theme — tokens y variantes parciales mezclados sobre el theme base.
  // Es la vía para themes generados por IA/CMS: puro dato.
  interface ThemeOverrides {
    tokens?: Partial<Omit<ThemeTokens, "colors">> & {
      colors?: Partial<ThemeTokens["colors"]>;
    };
    components?: Partial<ComponentVariantMap>;
  }
  const base = themes[themeRef];
  const overrides = t.themeOverrides as ThemeOverrides | undefined;
  const theme: ThemeConfig = overrides
    ? {
        name: `${base.name} (personalizado)`,
        tokens: {
          ...base.tokens,
          ...overrides.tokens,
          colors: { ...base.tokens.colors, ...(overrides.tokens?.colors ?? {}) },
        },
        components: { ...base.components, ...(overrides.components ?? {}) },
      }
    : base;

  const dataSource = t.dataSource;
  if (dataSource !== undefined && dataSource !== "shopify" && dataSource !== "fixtures") {
    fail(id, `dataSource inválido: "${String(dataSource)}" (usa "shopify" o "fixtures")`);
  }

  const customerAccount = t.customerAccount as
    | { shopId?: unknown; clientId?: unknown }
    | undefined;
  if (
    customerAccount &&
    (typeof customerAccount.shopId !== "string" ||
      !customerAccount.shopId ||
      typeof customerAccount.clientId !== "string" ||
      !customerAccount.clientId)
  ) {
    fail(id, "customerAccount requiere shopId y clientId (strings no vacíos)");
  }

  const legal = t.legal as { companyName?: unknown } | undefined;
  if (legal && (typeof legal.companyName !== "string" || !legal.companyName)) {
    fail(id, "legal requiere companyName (razón social)");
  }

  const pages = (t.pages ?? {}) as { homepage?: { type?: string }[] };
  const homepage = (pages.homepage ?? []).filter(
    (b) => b && KNOWN_BLOCKS.has(b.type ?? ""),
  ) as Block[];

  return {
    id,
    slug: typeof t.slug === "string" ? t.slug : id,
    domain: t.domain,
    dataSource: dataSource as TenantConfig["dataSource"],
    domains: Array.isArray(t.domains) ? (t.domains as string[]) : undefined,
    locale: typeof t.locale === "string" ? t.locale : "es-ES",
    branding: t.branding as TenantConfig["branding"],
    analytics: t.analytics as TenantConfig["analytics"],
    customerAccount: customerAccount as TenantConfig["customerAccount"],
    legal: legal as TenantConfig["legal"],
    theme,
    pages: { homepage },
    shopify: { storeDomain: shopify.storeDomain },
  };
}

/** Mezcla tenants remotos sobre los del repo (por id, el remoto gana). Pura y testeable. */
export function mergeTenantData(base: unknown[], remote: unknown[]): unknown[] {
  const byId = new Map<string, unknown>();
  for (const t of [...base, ...remote]) {
    const id = (t as { id?: string })?.id;
    if (typeof id === "string" && id) byId.set(id, t);
  }
  return [...byId.values()];
}

// Cache solo para el modo sin fuente remota (los JSON del repo no cambian
// en runtime). Con TENANTS_URL manda la caché de fetch de Next.
let staticCache: Map<string, TenantConfig> | null = null;

function toRegistry(data: unknown[]): Map<string, TenantConfig> {
  return new Map(data.map(hydrateTenant).map((t) => [t.id, t]));
}

export async function tenantRegistry(): Promise<Map<string, TenantConfig>> {
  const url = process.env.TENANTS_URL;
  if (!url) {
    return (staticCache ??= toRegistry(tenantData));
  }
  try {
    const res = await fetch(url, { next: { revalidate: 300, tags: ["tenants"] } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const remote = (await res.json()) as unknown[];
    if (!Array.isArray(remote)) throw new Error("la respuesta no es un array de tenants");
    return toRegistry(mergeTenantData(tenantData, remote));
  } catch (error) {
    console.error(`TENANTS_URL falló (${url}); usando los tenants del repo:`, error);
    return toRegistry(tenantData);
  }
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
