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
  /** Locale para formateo de precios y lang. */
  locale: string;
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
