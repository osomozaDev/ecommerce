import "server-only";
import { getTenant } from "@/lib/tenant/resolve";
import type { CommerceProvider, GetProductsOptions } from "../provider";
import { CACHE_TAGS, shopifyFetch } from "./client";
import { mapCart, mapCollection, mapProduct } from "./mappers";
import type {
  ShopifyCart,
  ShopifyCollection,
  ShopifyProduct,
} from "./types";
import {
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_QUERY,
} from "./queries/products";
import {
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_COLLECTIONS_QUERY,
} from "./queries/collections";
import { GET_CART_QUERY } from "./queries/cart";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
} from "./mutations/cart";

const SORT_MAP: Record<
  NonNullable<GetProductsOptions["sort"]>,
  { sortKey: string; reverse: boolean }
> = {
  latest: { sortKey: "CREATED_AT", reverse: true },
  "price-asc": { sortKey: "PRICE", reverse: false },
  "price-desc": { sortKey: "PRICE", reverse: true },
};

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface CartMutationPayload {
  cart: ShopifyCart | null;
  userErrors: { field: string[] | null; message: string }[];
}

function unwrapCart(payload: CartMutationPayload, operation: string): ShopifyCart {
  if (payload.userErrors.length > 0) {
    throw new Error(
      `Shopify ${operation}: ${payload.userErrors.map((e) => e.message).join(" | ")}`,
    );
  }
  if (!payload.cart) throw new Error(`Shopify ${operation}: sin carrito en la respuesta`);
  return payload.cart;
}

/**
 * El catálogo se cachea con tags POR TENANT; el carrito es por-usuario y
 * nunca se cachea. Cada método resuelve el tenant de la request una vez.
 */
export const shopifyProvider: CommerceProvider = {
  async getProducts(options?: GetProductsOptions) {
    const tenant = await getTenant();
    const sort = options?.sort ? SORT_MAP[options.sort] : undefined;
    const data = await shopifyFetch<{
      products: { nodes: ShopifyProduct[]; pageInfo: PageInfo };
    }>({
      query: GET_PRODUCTS_QUERY,
      variables: {
        first: options?.first ?? 24,
        after: options?.after,
        query: options?.query,
        sortKey: sort?.sortKey,
        reverse: sort?.reverse,
      },
      tags: [CACHE_TAGS.products(tenant.id)],
      tenant,
    });
    return {
      products: data.products.nodes.map((p) => mapProduct(p, tenant.locale)),
      hasNextPage: data.products.pageInfo.hasNextPage,
      endCursor: data.products.pageInfo.endCursor,
    };
  },

  async getProduct(handle) {
    const tenant = await getTenant();
    const data = await shopifyFetch<{ product: ShopifyProduct | null }>({
      query: GET_PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
      tags: [CACHE_TAGS.products(tenant.id), CACHE_TAGS.product(tenant.id, handle)],
      tenant,
    });
    return data.product ? mapProduct(data.product, tenant.locale) : null;
  },

  async getCollections() {
    const tenant = await getTenant();
    const data = await shopifyFetch<{ collections: { nodes: ShopifyCollection[] } }>({
      query: GET_COLLECTIONS_QUERY,
      variables: { first: 20 },
      tags: [CACHE_TAGS.collections(tenant.id)],
      tenant,
    });
    return data.collections.nodes.map(mapCollection);
  },

  async getCollection(handle, options) {
    const tenant = await getTenant();
    const data = await shopifyFetch<{
      collection:
        | (ShopifyCollection & {
            products: { nodes: ShopifyProduct[]; pageInfo: PageInfo };
          })
        | null;
    }>({
      query: GET_COLLECTION_BY_HANDLE_QUERY,
      variables: { handle, first: options?.first ?? 24, after: options?.after },
      tags: [
        CACHE_TAGS.collections(tenant.id),
        CACHE_TAGS.collection(tenant.id, handle),
      ],
      tenant,
    });
    if (!data.collection) return null;
    return {
      collection: mapCollection(data.collection),
      products: data.collection.products.nodes.map((p) =>
        mapProduct(p, tenant.locale),
      ),
      hasNextPage: data.collection.products.pageInfo.hasNextPage,
      endCursor: data.collection.products.pageInfo.endCursor,
    };
  },

  async createCart() {
    const tenant = await getTenant();
    const data = await shopifyFetch<{ cartCreate: CartMutationPayload }>({
      query: CART_CREATE_MUTATION,
      cache: "no-store",
      tenant,
    });
    return mapCart(unwrapCart(data.cartCreate, "cartCreate"), tenant.locale);
  },

  async getCart(cartId) {
    const tenant = await getTenant();
    const data = await shopifyFetch<{ cart: ShopifyCart | null }>({
      query: GET_CART_QUERY,
      variables: { cartId },
      cache: "no-store",
      tenant,
    });
    return data.cart ? mapCart(data.cart, tenant.locale) : null;
  },

  async addCartLines(cartId, lines) {
    const tenant = await getTenant();
    const data = await shopifyFetch<{ cartLinesAdd: CartMutationPayload }>({
      query: CART_LINES_ADD_MUTATION,
      variables: { cartId, lines },
      cache: "no-store",
      tenant,
    });
    return mapCart(unwrapCart(data.cartLinesAdd, "cartLinesAdd"), tenant.locale);
  },

  async updateCartLine(cartId, lineId, quantity) {
    const tenant = await getTenant();
    const data = await shopifyFetch<{ cartLinesUpdate: CartMutationPayload }>({
      query: CART_LINES_UPDATE_MUTATION,
      variables: { cartId, lines: [{ id: lineId, quantity }] },
      cache: "no-store",
      tenant,
    });
    return mapCart(unwrapCart(data.cartLinesUpdate, "cartLinesUpdate"), tenant.locale);
  },

  async removeCartLines(cartId, lineIds) {
    const tenant = await getTenant();
    const data = await shopifyFetch<{ cartLinesRemove: CartMutationPayload }>({
      query: CART_LINES_REMOVE_MUTATION,
      variables: { cartId, lineIds },
      cache: "no-store",
      tenant,
    });
    return mapCart(unwrapCart(data.cartLinesRemove, "cartLinesRemove"), tenant.locale);
  },
};
