import type { TenantConfig } from "@/lib/tenant/types";
import { themeB } from "@/config/themes/theme-b";

/**
 * Segundo tenant: existe para demostrar el test arquitectónico obligatorio.
 * MISMO Storefront Engine, otra tienda Shopify, otro theme, otros bloques.
 * Se activa con TENANT_ID=tienda-b. Cero cambios en components/, lib/ o app/.
 */
export const tiendaB: TenantConfig = {
  id: "tienda-b",
  slug: "norte-atelier",
  domain: "https://norte-atelier.example.com",
  locale: "es-ES",
  branding: {
    name: "Norte Atelier",
    tagline: "Diseño nórdico contemporáneo",
  },
  theme: themeB,
  pages: {
    homepage: [
      {
        type: "hero",
        title: "Menos, pero mejor",
        subtitle: "Selección estricta de diseño nórdico contemporáneo.",
        ctaLabel: "Explorar catálogo",
        ctaHref: "/productos",
      },
      {
        type: "banner",
        text: "Nueva temporada — piezas numeradas",
      },
      {
        type: "featuredCollection",
        collection: "novedades",
        title: "Recién llegado",
        first: 4,
      },
    ],
  },
  shopify: {
    storeDomain: "norte-atelier.myshopify.com",
  },
};
