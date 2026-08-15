import "server-only";
import { randomUUID } from "node:crypto";
import type { Cart, CartLine, Product } from "../types";
import type {
  CartLineInput,
  CatalogFilters,
  CommerceProvider,
  GetProductsOptions,
} from "../provider";
import { money } from "../money";
import { fixtureProducts, findFixtureProduct, findFixtureVariant } from "@/fixtures/products";
import { fixtureCollections, fixtureCollectionProducts } from "@/fixtures/collections";

/**
 * Provider de fixtures: sirve el catálogo de src/fixtures y simula el carrito
 * en memoria. Permite desarrollar toda la UI (y este proyecto entero) sin
 * credenciales de Shopify. El estado del carrito vive en el proceso del
 * dev server: se pierde al reiniciar, y es suficiente para desarrollo.
 */

// globalThis para sobrevivir al hot-reload del dev server.
const g = globalThis as unknown as { __fixtureCarts?: Map<string, Cart> };
const carts = (g.__fixtureCarts ??= new Map<string, Cart>());

function recompute(cart: Cart): Cart {
  const lines = cart.lines.map((l) => ({
    ...l,
    lineTotal: money(l.unitPrice.amount * l.quantity, l.unitPrice.currencyCode),
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal.amount, 0);
  return {
    ...cart,
    lines,
    totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal: money(subtotal),
    total: money(subtotal),
  };
}

function applyFilters(products: Product[], f?: CatalogFilters): Product[] {
  return products.filter((p) => {
    if (f?.available && !p.available) return false;
    if (f?.priceMin !== undefined && p.price.amount < f.priceMin) return false;
    if (f?.priceMax !== undefined && p.price.amount > f.priceMax) return false;
    return true;
  });
}

function applySort(products: Product[], sort?: GetProductsOptions["sort"]): Product[] {
  const sorted = [...products];
  if (sort === "price-asc") sorted.sort((a, b) => a.price.amount - b.price.amount);
  if (sort === "price-desc") sorted.sort((a, b) => b.price.amount - a.price.amount);
  return sorted;
}

function requireCart(cartId: string): Cart {
  const cart = carts.get(cartId);
  if (!cart) throw new Error(`Carrito de fixtures no encontrado: ${cartId}`);
  return cart;
}

export const fixturesProvider: CommerceProvider = {
  async getProducts(options?: GetProductsOptions) {
    let products = [...fixtureProducts];
    const q = options?.query?.toLowerCase();
    if (q) products = products.filter((p) => p.title.toLowerCase().includes(q));
    products = applySort(applyFilters(products, options), options?.sort);

    // Cursor simulado: el offset como string (Shopify usa cursores opacos).
    const offset = options?.after ? parseInt(options.after, 10) || 0 : 0;
    const first = options?.first ?? 24;
    const page = products.slice(offset, offset + first);
    const end = offset + page.length;
    return {
      products: page,
      hasNextPage: end < products.length,
      endCursor: page.length > 0 ? String(end) : null,
    };
  },

  async getProduct(handle) {
    return findFixtureProduct(handle) ?? null;
  },

  async getCollections() {
    return fixtureCollections;
  },

  async getCollection(handle, options) {
    const collection = fixtureCollections.find((c) => c.handle === handle);
    if (!collection) return null;
    const handles = fixtureCollectionProducts[handle] ?? [];
    const all = applySort(
      applyFilters(
        handles.map((h) => findFixtureProduct(h)).filter((p) => p !== undefined),
        options,
      ),
      options?.sort,
    );

    const offset = options?.after ? parseInt(options.after, 10) || 0 : 0;
    const first = options?.first ?? 24;
    const page = all.slice(offset, offset + first);
    const end = offset + page.length;
    return {
      collection,
      products: page,
      hasNextPage: end < all.length,
      endCursor: page.length > 0 ? String(end) : null,
    };
  },

  async createCart() {
    const cart: Cart = {
      id: `fx-cart-${randomUUID()}`,
      lines: [],
      totalQuantity: 0,
      subtotal: money(0),
      total: money(0),
      checkoutUrl: "#checkout-simulado",
    };
    carts.set(cart.id, cart);
    return cart;
  },

  async getCart(cartId) {
    return carts.get(cartId) ?? null;
  },

  async addCartLines(cartId, lines: CartLineInput[]) {
    const cart = requireCart(cartId);
    for (const input of lines) {
      const existing = cart.lines.find((l) => l.merchandiseId === input.merchandiseId);
      if (existing) {
        existing.quantity += input.quantity;
        continue;
      }
      const found = findFixtureVariant(input.merchandiseId);
      if (!found) throw new Error(`Variante desconocida: ${input.merchandiseId}`);
      const { product, variant } = found;
      const line: CartLine = {
        id: `fx-line-${randomUUID()}`,
        merchandiseId: variant.id,
        productTitle: product.title,
        variantTitle: variant.title,
        href: product.href,
        image: variant.image ?? product.images[0],
        quantity: input.quantity,
        unitPrice: variant.price,
        lineTotal: variant.price,
      };
      cart.lines.push(line);
    }
    const updated = recompute(cart);
    carts.set(cartId, updated);
    return updated;
  },

  async updateCartLine(cartId, lineId, quantity) {
    const cart = requireCart(cartId);
    if (quantity <= 0) {
      cart.lines = cart.lines.filter((l) => l.id !== lineId);
    } else {
      const line = cart.lines.find((l) => l.id === lineId);
      if (line) line.quantity = quantity;
    }
    const updated = recompute(cart);
    carts.set(cartId, updated);
    return updated;
  },

  async removeCartLines(cartId, lineIds) {
    const cart = requireCart(cartId);
    cart.lines = cart.lines.filter((l) => !lineIds.includes(l.id));
    const updated = recompute(cart);
    carts.set(cartId, updated);
    return updated;
  },
};
