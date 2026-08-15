import "server-only";
import { randomUUID } from "node:crypto";
import type { Cart, CartLine } from "../types";
import type { CartLineInput, CommerceProvider, GetProductsOptions } from "../provider";
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
    if (options?.sort === "price-asc")
      products.sort((a, b) => a.price.amount - b.price.amount);
    if (options?.sort === "price-desc")
      products.sort((a, b) => b.price.amount - a.price.amount);
    return products.slice(0, options?.first ?? 24);
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
    const products = handles
      .map((h) => findFixtureProduct(h))
      .filter((p) => p !== undefined)
      .slice(0, options?.first ?? 24);
    return { collection, products };
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
