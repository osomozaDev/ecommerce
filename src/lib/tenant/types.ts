import type { ThemeConfig } from "@/theme/types";
import type { Block } from "@/blocks/types";

/**
 * Configuración PÚBLICA de un tenant (tienda). Sin secretos:
 * el token Storefront vive únicamente en variables de entorno server-side
 * (ver lib/commerce/shopify/client.ts).
 *
 * Conectar una tienda nueva = crear un archivo en config/tenants/
 * + un theme en config/themes/ + variables de entorno. Cero código.
 */
export interface TenantConfig {
  id: string;
  slug: string;
  /** Dominio público canónico, con protocolo. Base de SEO/canonical/sitemap. */
  domain: string;
  /** Hostnames adicionales que resuelven a este tenant (aliases, *.localhost). */
  domains?: string[];
  /** Locale para formateo de precios y lang. */
  locale: string;
  /**
   * Fuente de datos de ESTE tenant. Si no se define, manda el env
   * COMMERCE_DATA_SOURCE. Permite tiendas demo (fixtures) conviviendo
   * con tiendas reales (shopify) en el mismo deploy.
   */
  dataSource?: "shopify" | "fixtures";
  branding: {
    name: string;
    tagline?: string;
  };
  theme: ThemeConfig;
  pages: {
    homepage: Block[];
  };
  shopify: {
    /** xxx.myshopify.com — es público, no es un secreto. */
    storeDomain: string;
  };
}
