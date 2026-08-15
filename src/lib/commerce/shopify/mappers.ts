import "server-only";
import type {
  Cart,
  CartLine,
  Collection,
  Image,
  Money,
  Product,
  ProductVariant,
} from "../types";
import { money } from "../money";
import type {
  ShopifyCart,
  ShopifyCartLine,
  ShopifyCollection,
  ShopifyImage,
  ShopifyMoney,
  ShopifyProduct,
  ShopifyVariant,
} from "./types";

/**
 * Mappers: normalizan los objetos crudos de Shopify a los ViewModels del
 * contrato. Todo lo que la UI necesita ya resuelto: href, precio formateado,
 * badge, disponibilidad. Ningún tipo Shopify sale de esta capa.
 */

function mapMoney(m: ShopifyMoney, locale: string): Money {
  return money(parseFloat(m.amount), m.currencyCode, locale);
}

function mapImage(img: ShopifyImage, fallbackAlt: string): Image {
  return {
    src: img.url,
    alt: img.altText ?? fallbackAlt,
    width: img.width ?? undefined,
    height: img.height ?? undefined,
  };
}

function mapVariant(
  v: ShopifyVariant,
  productTitle: string,
  locale: string,
): ProductVariant {
  const compareAt =
    v.compareAtPrice && parseFloat(v.compareAtPrice.amount) > parseFloat(v.price.amount)
      ? mapMoney(v.compareAtPrice, locale)
      : undefined;
  return {
    id: v.id,
    title: v.title,
    available: v.availableForSale,
    selectedOptions: v.selectedOptions,
    price: mapMoney(v.price, locale),
    compareAtPrice: compareAt,
    image: v.image ? mapImage(v.image, productTitle) : undefined,
  };
}

function deriveBadge(p: ShopifyProduct, compareAtPrice?: Money): string | undefined {
  if (compareAtPrice) return "Oferta";
  if (p.tags.some((t) => t.toLowerCase() === "nuevo")) return "Nuevo";
  return undefined;
}

export function mapProduct(p: ShopifyProduct, locale: string): Product {
  const price = mapMoney(p.priceRange.minVariantPrice, locale);
  const compareAtRaw = p.compareAtPriceRange?.minVariantPrice;
  const compareAtPrice =
    compareAtRaw && parseFloat(compareAtRaw.amount) > price.amount
      ? mapMoney(compareAtRaw, locale)
      : undefined;

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    href: `/productos/${p.handle}`,
    images: p.images.nodes.map((img) => mapImage(img, p.title)),
    price,
    compareAtPrice,
    available: p.availableForSale,
    badge: deriveBadge(p, compareAtPrice),
    options: p.options.map((o) => ({
      name: o.name,
      values: o.optionValues.map((v) => v.name),
    })),
    variants: p.variants.nodes.map((v) => mapVariant(v, p.title, locale)),
    seo: {
      title: p.seo.title ?? p.title,
      description: p.seo.description ?? p.description.slice(0, 155),
    },
  };
}

export function mapCollection(c: ShopifyCollection): Collection {
  return {
    id: c.id,
    handle: c.handle,
    title: c.title,
    description: c.description,
    href: `/colecciones/${c.handle}`,
    image: c.image ? mapImage(c.image, c.title) : undefined,
    seo: {
      title: c.seo.title ?? c.title,
      description: c.seo.description ?? c.description.slice(0, 155),
    },
  };
}

function mapCartLine(l: ShopifyCartLine, locale: string): CartLine {
  const m = l.merchandise;
  return {
    id: l.id,
    merchandiseId: m.id,
    productTitle: m.product.title,
    // Shopify usa "Default Title" para productos sin opciones: no es un dato útil.
    variantTitle: m.title === "Default Title" ? undefined : m.title,
    href: `/productos/${m.product.handle}`,
    image: m.image ? mapImage(m.image, m.product.title) : undefined,
    quantity: l.quantity,
    unitPrice: mapMoney(m.price, locale),
    lineTotal: mapMoney(l.cost.totalAmount, locale),
  };
}

export function mapCart(c: ShopifyCart, locale: string): Cart {
  return {
    id: c.id,
    lines: c.lines.nodes.map((l) => mapCartLine(l, locale)),
    totalQuantity: c.totalQuantity,
    subtotal: mapMoney(c.cost.subtotalAmount, locale),
    total: mapMoney(c.cost.totalAmount, locale),
    checkoutUrl: c.checkoutUrl,
  };
}
