/**
 * ViewModels del dominio commerce.
 *
 * ESTE ARCHIVO ES EL CONTRATO entre la infraestructura (Shopify, fixtures)
 * y el design system. La UI solo conoce estos tipos: nunca tipos GraphQL
 * ni objetos crudos de Shopify. Los fixtures respetan exactamente estas formas.
 */

export interface Money {
  amount: number;
  currencyCode: string;
  /** Ya formateado con Intl.NumberFormat — la UI nunca formatea precios. */
  formatted: string;
}

export interface Image {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Seo {
  title?: string;
  description?: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  available: boolean;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice?: Money;
  image?: Image;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  /** Ruta interna ya resuelta, ej. /productos/vela-ambar */
  href: string;
  images: Image[];
  /** Precio de la variante más barata. */
  price: Money;
  compareAtPrice?: Money;
  available: boolean;
  badge?: string;
  options: ProductOption[];
  variants: ProductVariant[];
  seo: Seo;
}

/** Página de resultados de catálogo con cursor de continuación. */
export interface ProductList {
  products: Product[];
  hasNextPage: boolean;
  /** Cursor para pedir la página siguiente (null si no hay más). */
  endCursor: string | null;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  href: string;
  image?: Image;
  seo: Seo;
}

export interface CartLine {
  id: string;
  /** Id de la variante (merchandise) — lo que se añade al carrito. */
  merchandiseId: string;
  productTitle: string;
  variantTitle?: string;
  href: string;
  image?: Image;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface Cart {
  id: string;
  lines: CartLine[];
  totalQuantity: number;
  subtotal: Money;
  total: Money;
  /** URL de Shopify Checkout. El pago ocurre siempre en Shopify. */
  checkoutUrl: string;
}
