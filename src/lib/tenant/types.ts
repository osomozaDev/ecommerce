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
  /**
   * Medición por tenant (ids públicos, no son secretos). Si se define un
   * vendor para una tienda de la UE, esa tienda necesita banner de
   * consentimiento antes de salir a producción (pendiente de plataforma).
   */
  analytics?: {
    /** GA4, ej. "G-XXXXXXXXXX". */
    ga4MeasurementId?: string;
    /** Dominio configurado en Plausible, ej. "tienda.com". */
    plausibleDomain?: string;
  };
  /**
   * Login de clientes (Customer Account API, OAuth + PKCE). Ambos valores son
   * identificadores PÚBLICOS de un cliente OAuth "public" (viajan en la URL de
   * autorización): se obtienen en el admin — Sales channels → Headless (o
   * Hydrogen) → Customer Account API. Sin este bloque, /cuenta queda
   * deshabilitada para la tienda.
   */
  customerAccount?: {
    /** Id numérico de la tienda, ej. "60857843734" (aparece en las URLs de la API). */
    shopId: string;
    /** Client ID del cliente OAuth, ej. "shp_xxxxx". */
    clientId: string;
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
