import type { TenantConfig } from "@/lib/tenant/types";
import { themeA } from "@/config/themes/theme-a";

export const defaultTenant: TenantConfig = {
  id: "default",
  slug: "circulo-studio",
  domain: "https://circulo-studio.example.com",
  locale: "es-ES",
  branding: {
    name: "Stellazon",
    tagline: "Material de montaña seleccionado",
  },
  theme: themeA,
  pages: {
    homepage: [
      {
        type: "hero",
        title: "La montaña empieza aquí",
        subtitle:
          "Tablas y equipamiento seleccionados para durar más que la temporada.",
        ctaLabel: "Ver productos",
        ctaHref: "/productos",
        image: { src: "/fixtures/producto-5.svg", alt: "Snowboard sobre nieve" },
      },
      {
        type: "featuredCollection",
        collection: "automated-collection",
        title: "Destacados",
        first: 4,
      },
      {
        type: "banner",
        text: "Envío gratuito a partir de 60 €",
        href: "/productos",
      },
      {
        type: "featuredCollection",
        collection: "hydrogen",
        title: "Colección Hydrogen",
        first: 4,
      },
    ],
  },
  shopify: {
    storeDomain: "stellazon.myshopify.com",
  },
};
