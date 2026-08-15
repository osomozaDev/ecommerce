import "server-only";
import type { Cart, Collection, Product, ProductList } from "./types";
import { fixturesProvider } from "./fixtures/provider";
import { shopifyProvider } from "./shopify/provider";

export interface GetProductsOptions {
  first?: number;
  /** Cursor de paginación: el endCursor de la página anterior. */
  after?: string;
  /** Búsqueda de texto libre (sintaxis de Shopify en modo shopify). */
  query?: string;
  sort?: "latest" | "price-asc" | "price-desc";
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
}

/**
 * Contrato de acceso a datos commerce. Todo devuelve ViewModels.
 * Dos implementaciones: shopify (real) y fixtures (en memoria).
 * Se selecciona con COMMERCE_DATA_SOURCE=shopify|fixtures.
 */
export interface CommerceProvider {
  getProducts(options?: GetProductsOptions): Promise<ProductList>;
  getProduct(handle: string): Promise<Product | null>;
  getCollections(): Promise<Collection[]>;
  getCollection(
    handle: string,
    options?: { first?: number },
  ): Promise<{ collection: Collection; products: Product[] } | null>;

  createCart(): Promise<Cart>;
  getCart(cartId: string): Promise<Cart | null>;
  addCartLines(cartId: string, lines: CartLineInput[]): Promise<Cart>;
  updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart>;
  removeCartLines(cartId: string, lineIds: string[]): Promise<Cart>;
}

export function getCommerce(): CommerceProvider {
  const source = process.env.COMMERCE_DATA_SOURCE ?? "fixtures";
  if (source === "shopify") return shopifyProvider;
  if (source === "fixtures") return fixturesProvider;
  throw new Error(
    `COMMERCE_DATA_SOURCE inválido: "${source}" (usa "shopify" o "fixtures")`,
  );
}
