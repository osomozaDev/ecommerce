"use client";

import type { Cart, CartLine, Product, ProductVariant } from "@/lib/commerce/types";

/**
 * Capa de eventos de analítica. Eventos ecommerce con el esquema estándar de
 * GA4, emitidos SIEMPRE a window.dataLayer (compatible con Google Tag Manager
 * y verificable en tests sin ningún vendor) y, si el tenant los configuró,
 * a gtag (GA4) y Plausible. La UI llama a track()/helpers y no sabe qué
 * vendors hay detrás.
 */

export type AnalyticsEventName =
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "search";

interface AnalyticsWindow extends Window {
  dataLayer?: Record<string, unknown>[];
  gtag?: (...args: unknown[]) => void;
  plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
}

export function track(name: AnalyticsEventName, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as AnalyticsWindow;

  // GTM / tests: siempre disponible
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event: name, ...params });

  // GA4 directo (si AnalyticsScripts lo cargó para este tenant)
  w.gtag?.("event", name, params);

  // Plausible (eventos custom con props planas)
  w.plausible?.(name, {
    props: { value: params.value, currency: params.currency, search_term: params.search_term },
  });
}

// ── Helpers con el esquema ecommerce de GA4 ──

function ga4Item(product: Product, variant?: ProductVariant, quantity = 1) {
  return {
    item_id: variant?.id ?? product.id,
    item_name: product.title,
    item_variant: variant?.title,
    price: (variant?.price ?? product.price).amount,
    quantity,
  };
}

function lineItem(line: CartLine) {
  return {
    item_id: line.merchandiseId,
    item_name: line.productTitle,
    item_variant: line.variantTitle,
    price: line.unitPrice.amount,
    quantity: line.quantity,
  };
}

export function trackViewItem(product: Product) {
  track("view_item", {
    currency: product.price.currencyCode,
    value: product.price.amount,
    items: [ga4Item(product)],
  });
}

export function trackAddToCart(product: Product, variant: ProductVariant, quantity: number) {
  track("add_to_cart", {
    currency: variant.price.currencyCode,
    value: variant.price.amount * quantity,
    items: [ga4Item(product, variant, quantity)],
  });
}

export function trackRemoveFromCart(line: CartLine) {
  track("remove_from_cart", {
    currency: line.unitPrice.currencyCode,
    value: line.lineTotal.amount,
    items: [lineItem(line)],
  });
}

export function trackBeginCheckout(cart: Cart) {
  track("begin_checkout", {
    currency: cart.total.currencyCode,
    value: cart.total.amount,
    items: cart.lines.map((l) => lineItem(l)),
  });
}

export function trackSearch(term: string) {
  track("search", { search_term: term });
}
