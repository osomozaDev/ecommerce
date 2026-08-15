import "server-only";
import type { Cart, Collection, Product, ProductList } from "./types";
import { fixturesProvider } from "./fixtures/provider";
import { shopifyProvider } from "./shopify/provider";
import { getTenant } from "@/lib/tenant/resolve";

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
    options?: { first?: number; after?: string },
  ): Promise<{
    collection: Collection;
    products: Product[];
    hasNextPage: boolean;
    endCursor: string | null;
  } | null>;

  createCart(): Promise<Cart>;
  getCart(cartId: string): Promise<Cart | null>;
  addCartLines(cartId: string, lines: CartLineInput[]): Promise<Cart>;
  updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart>;
  removeCartLines(cartId: string, lineIds: string[]): Promise<Cart>;
}

async function pickProvider(): Promise<CommerceProvider> {
  const tenant = await getTenant();
  const source =
    tenant.dataSource ?? process.env.COMMERCE_DATA_SOURCE ?? "fixtures";
  if (source === "shopify") return shopifyProvider;
  if (source === "fixtures") return fixturesProvider;
  throw new Error(
    `Data source inválido: "${source}" (usa "shopify" o "fixtures")`,
  );
}

/**
 * Fachada: el provider real se elige POR REQUEST según el tenant
 * (tenant.dataSource, con fallback al env COMMERCE_DATA_SOURCE). Así una
 * tienda demo en fixtures y una real en Shopify conviven en el mismo deploy.
 */
export function getCommerce(): CommerceProvider {
  return {
    getProducts: async (o) => (await pickProvider()).getProducts(o),
    getProduct: async (h) => (await pickProvider()).getProduct(h),
    getCollections: async () => (await pickProvider()).getCollections(),
    getCollection: async (h, o) => (await pickProvider()).getCollection(h, o),
    createCart: async () => (await pickProvider()).createCart(),
    getCart: async (id) => (await pickProvider()).getCart(id),
    addCartLines: async (id, l) => (await pickProvider()).addCartLines(id, l),
    updateCartLine: async (id, l, q) => (await pickProvider()).updateCartLine(id, l, q),
    removeCartLines: async (id, l) => (await pickProvider()).removeCartLines(id, l),
  };
}
