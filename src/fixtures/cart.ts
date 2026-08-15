import type { Cart } from "@/lib/commerce/types";
import { money } from "@/lib/commerce/money";

/** Carrito de muestra para el design system y para maquetar estados del CartView. */
export const fixtureCart: Cart = {
  id: "fx-cart-demo",
  totalQuantity: 3,
  lines: [
    {
      id: "fx-line-1",
      merchandiseId: "fx-var-vela-250",
      productTitle: "Vela aromática Ámbar",
      variantTitle: "250 g",
      href: "/productos/vela-ambar",
      image: { src: "/fixtures/producto-1.svg", alt: "Vela aromática Ámbar", width: 800, height: 1000 },
      quantity: 2,
      unitPrice: money(24),
      lineTotal: money(48),
    },
    {
      id: "fx-line-2",
      merchandiseId: "fx-var-jarron-m",
      productTitle: "Jarrón Luna",
      variantTitle: "M — 26 cm",
      href: "/productos/jarron-luna",
      image: { src: "/fixtures/producto-2.svg", alt: "Jarrón Luna", width: 800, height: 1000 },
      quantity: 1,
      unitPrice: money(45),
      lineTotal: money(45),
    },
  ],
  subtotal: money(93),
  total: money(93),
  checkoutUrl: "#checkout-simulado",
};

export const emptyFixtureCart: Cart = {
  id: "fx-cart-vacio",
  totalQuantity: 0,
  lines: [],
  subtotal: money(0),
  total: money(0),
  checkoutUrl: "#checkout-simulado",
};
