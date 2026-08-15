/**
 * Bloques de página configurables. La homepage de cada tenant se define como
 * una lista de bloques (ver config/tenants/). En el futuro esta configuración
 * la generará la IA / un CMS; el patrón ya queda establecido.
 */

export type Block =
  | {
      type: "hero";
      variant?: string;
      title: string;
      subtitle?: string;
      ctaLabel?: string;
      ctaHref?: string;
      image?: { src: string; alt: string };
    }
  | {
      type: "featuredCollection";
      /** Handle de la colección en Shopify. */
      collection: string;
      title?: string;
      first?: number;
    }
  | {
      type: "banner";
      variant?: string;
      text: string;
      href?: string;
    };
