import "server-only";
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

/** El catálogo se cachea con tags; el carrito es por-usuario y nunca se cachea. */
export const shopifyProvider: CommerceProvider = {
  async getProducts(options?: GetProductsOptions) {
    const sort = options?.sort ? SORT_MAP[options.sort] : undefined;
    const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>({
      query: GET_PRODUCTS_QUERY,
      variables: {
        first: options?.first ?? 24,
        query: options?.query,
        sortKey: sort?.sortKey,
        reverse: sort?.reverse,
      },
      tags: [CACHE_TAGS.products],
    });
    return data.products.nodes.map(mapProduct);
  },

  async getProduct(handle) {
    const data = await shopifyFetch<{ product: ShopifyProduct | null }>({
      query: GET_PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
      tags: [CACHE_TAGS.products, CACHE_TAGS.product(handle)],
    });
    return data.product ? mapProduct(data.product) : null;
  },

  async getCollections() {
    const data = await shopifyFetch<{ collections: { nodes: ShopifyCollection[] } }>({
      query: GET_COLLECTIONS_QUERY,
      variables: { first: 20 },
      tags: [CACHE_TAGS.collections],
    });
    return data.collections.nodes.map(mapCollection);
  },

  async getCollection(handle, options) {
    const data = await shopifyFetch<{
      collection: (ShopifyCollection & { products: { nodes: ShopifyProduct[] } }) | null;
    }>({
      query: GET_COLLECTION_BY_HANDLE_QUERY,
      variables: { handle, first: options?.first ?? 24 },
      tags: [CACHE_TAGS.collections, CACHE_TAGS.collection(handle)],
    });
    if (!data.collection) return null;
    return {
      collection: mapCollection(data.collection),
      products: data.collection.products.nodes.map(mapProduct),
    };
  },

  async createCart() {
    const data = await shopifyFetch<{ cartCreate: CartMutationPayload }>({
      query: CART_CREATE_MUTATION,
      cache: "no-store",
    });
    return mapCart(unwrapCart(data.cartCreate, "cartCreate"));
  },

  async getCart(cartId) {
    const data = await shopifyFetch<{ cart: ShopifyCart | null }>({
      query: GET_CART_QUERY,
      variables: { cartId },
      cache: "no-store",
    });
    return data.cart ? mapCart(data.cart) : null;
  },

  async addCartLines(cartId, lines) {
    const data = await shopifyFetch<{ cartLinesAdd: CartMutationPayload }>({
      query: CART_LINES_ADD_MUTATION,
      variables: { cartId, lines },
      cache: "no-store",
    });
    return mapCart(unwrapCart(data.cartLinesAdd, "cartLinesAdd"));
  },

  async updateCartLine(cartId, lineId, quantity) {
    const data = await shopifyFetch<{ cartLinesUpdate: CartMutationPayload }>({
      query: CART_LINES_UPDATE_MUTATION,
      variables: { cartId, lines: [{ id: lineId, quantity }] },
      cache: "no-store",
    });
    return mapCart(unwrapCart(data.cartLinesUpdate, "cartLinesUpdate"));
  },

  async removeCartLines(cartId, lineIds) {
    const data = await shopifyFetch<{ cartLinesRemove: CartMutationPayload }>({
      query: CART_LINES_REMOVE_MUTATION,
      variables: { cartId, lineIds },
      cache: "no-store",
    });
    return mapCart(unwrapCart(data.cartLinesRemove, "cartLinesRemove"));
  },
};
