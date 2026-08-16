import type { Collection, Product, ProductReviews } from "@/lib/commerce/types";
import type { TenantConfig } from "@/lib/tenant/types";

/**
 * Builders de JSON-LD (schema.org) a partir de ViewModels. Funciones puras:
 * ni red ni Shopify, así que se testean como el resto del contrato.
 */

function absoluteUrl(pathOrUrl: string, tenant: TenantConfig): string {
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${tenant.domain}${pathOrUrl}`;
}

export function productJsonLd(
  product: Product,
  tenant: TenantConfig,
  reviews?: ProductReviews,
) {
  const url = absoluteUrl(product.href, tenant);
  const prices = product.variants.map((v) => v.price.amount);
  const currency = product.price.currencyCode;

  const offers =
    product.variants.length > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: currency,
          lowPrice: Math.min(...prices).toFixed(2),
          highPrice: Math.max(...prices).toFixed(2),
          offerCount: product.variants.length,
          availability: product.available
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url,
        }
      : {
          "@type": "Offer",
          priceCurrency: currency,
          price: product.price.amount.toFixed(2),
          availability: product.available
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url,
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seo.description ?? product.description,
    image: product.images.map((img) => absoluteUrl(img.src, tenant)),
    url,
    brand: { "@type": "Brand", name: tenant.branding.name },
    offers,
    ...(reviews && reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.averageRating,
            reviewCount: reviews.count,
            bestRating: 5,
          },
          review: reviews.reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author },
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            ...(r.title ? { name: r.title } : {}),
            reviewBody: r.body,
          })),
        }
      : {}),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; href: string }[],
  tenant: TenantConfig,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href, tenant),
    })),
  };
}

export function collectionBreadcrumb(collection: Collection) {
  return [
    { name: "Inicio", href: "/" },
    { name: "Colecciones", href: "/colecciones" },
    { name: collection.title, href: collection.href },
  ];
}

export function productBreadcrumb(product: Product) {
  return [
    { name: "Inicio", href: "/" },
    { name: "Productos", href: "/productos" },
    { name: product.title, href: product.href },
  ];
}

export function organizationJsonLd(tenant: TenantConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: tenant.branding.name,
    description: tenant.branding.tagline,
    url: tenant.domain,
  };
}
