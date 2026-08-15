import { describe, expect, it } from "vitest";
import { mapCart, mapCollection, mapProduct } from "./mappers";
import { money } from "../money";
import type {
  ShopifyCart,
  ShopifyCollection,
  ShopifyImage,
  ShopifyProduct,
  ShopifyVariant,
} from "./types";

/**
 * Tests del CONTRATO: los mappers son la frontera entre Shopify y la UI.
 * Si Shopify cambia algo o alguien toca un mapper, esto es lo que avisa.
 */

// El formateo es-ES usa espacio no separable; se normaliza para comparar.
const fmt = (s: string) => s.replace(/ /g, " ");

const image = (n = 1): ShopifyImage => ({
  url: `https://cdn.shopify.com/s/files/producto-${n}.jpg`,
  altText: null,
  width: 800,
  height: 1000,
});

const variant = (overrides: Partial<ShopifyVariant> = {}): ShopifyVariant => ({
  id: "gid://shopify/ProductVariant/1",
  title: "S",
  availableForSale: true,
  selectedOptions: [{ name: "Talla", value: "S" }],
  price: { amount: "32.0", currencyCode: "EUR" },
  compareAtPrice: null,
  image: null,
  ...overrides,
});

const product = (overrides: Partial<ShopifyProduct> = {}): ShopifyProduct => ({
  id: "gid://shopify/Product/1",
  handle: "jarron-luna",
  title: "Jarrón Luna",
  description: "Cerámica esmaltada a mano.",
  availableForSale: true,
  tags: [],
  images: { nodes: [image()] },
  priceRange: { minVariantPrice: { amount: "32.0", currencyCode: "EUR" } },
  compareAtPriceRange: { minVariantPrice: { amount: "0.0", currencyCode: "EUR" } },
  options: [{ name: "Talla", optionValues: [{ name: "S" }, { name: "M" }] }],
  variants: { nodes: [variant()] },
  seo: { title: null, description: null },
  ...overrides,
});

describe("money", () => {
  it("formatea EUR en es-ES", () => {
    const m = money(1234.5);
    expect(m.amount).toBe(1234.5);
    expect(m.currencyCode).toBe("EUR");
    expect(fmt(m.formatted)).toBe("1234,50 €");
  });
});

describe("mapProduct", () => {
  it("resuelve href y precios ya listos para la UI", () => {
    const p = mapProduct(product());
    expect(p.href).toBe("/productos/jarron-luna");
    expect(p.price.amount).toBe(32);
    expect(fmt(p.price.formatted)).toBe("32,00 €");
    expect(p.compareAtPrice).toBeUndefined();
    expect(p.available).toBe(true);
  });

  it("usa el título como alt cuando la imagen no trae altText", () => {
    const p = mapProduct(product());
    expect(p.images[0].alt).toBe("Jarrón Luna");
  });

  it("deriva badge Oferta cuando compareAt es mayor que el precio", () => {
    const p = mapProduct(
      product({
        compareAtPriceRange: {
          minVariantPrice: { amount: "42.0", currencyCode: "EUR" },
        },
      }),
    );
    expect(p.compareAtPrice?.amount).toBe(42);
    expect(p.badge).toBe("Oferta");
  });

  it("ignora compareAt cuando es 0 o no supera el precio", () => {
    const p = mapProduct(
      product({
        compareAtPriceRange: {
          minVariantPrice: { amount: "32.0", currencyCode: "EUR" },
        },
      }),
    );
    expect(p.compareAtPrice).toBeUndefined();
    expect(p.badge).toBeUndefined();
  });

  it("deriva badge Nuevo desde el tag (sin distinguir mayúsculas)", () => {
    const p = mapProduct(product({ tags: ["Destacado", "NUEVO"] }));
    expect(p.badge).toBe("Nuevo");
  });

  it("mapea opciones desde optionValues", () => {
    const p = mapProduct(product());
    expect(p.options).toEqual([{ name: "Talla", values: ["S", "M"] }]);
  });

  it("mapea variantes con disponibilidad y compareAt filtrado", () => {
    const p = mapProduct(
      product({
        variants: {
          nodes: [
            variant(),
            variant({
              id: "gid://shopify/ProductVariant/2",
              title: "M",
              availableForSale: false,
              selectedOptions: [{ name: "Talla", value: "M" }],
              price: { amount: "45.0", currencyCode: "EUR" },
              compareAtPrice: { amount: "58.0", currencyCode: "EUR" },
            }),
          ],
        },
      }),
    );
    expect(p.variants).toHaveLength(2);
    expect(p.variants[1].available).toBe(false);
    expect(p.variants[1].compareAtPrice?.amount).toBe(58);
    expect(p.variants[0].compareAtPrice).toBeUndefined();
  });

  it("rellena seo con fallbacks del producto", () => {
    const p = mapProduct(product());
    expect(p.seo.title).toBe("Jarrón Luna");
    expect(p.seo.description).toBe("Cerámica esmaltada a mano.");
  });
});

describe("mapCollection", () => {
  const collection: ShopifyCollection = {
    id: "gid://shopify/Collection/1",
    handle: "novedades",
    title: "Novedades",
    description: "Lo último.",
    image: null,
    seo: { title: null, description: null },
  };

  it("resuelve href y tolera colección sin imagen", () => {
    const c = mapCollection(collection);
    expect(c.href).toBe("/colecciones/novedades");
    expect(c.image).toBeUndefined();
    expect(c.seo.title).toBe("Novedades");
  });
});

describe("mapCart", () => {
  const cart: ShopifyCart = {
    id: "gid://shopify/Cart/1",
    checkoutUrl: "https://stellazon.myshopify.com/cart/c/abc",
    totalQuantity: 3,
    cost: {
      subtotalAmount: { amount: "109.0", currencyCode: "EUR" },
      totalAmount: { amount: "109.0", currencyCode: "EUR" },
    },
    lines: {
      nodes: [
        {
          id: "gid://shopify/CartLine/1",
          quantity: 2,
          cost: { totalAmount: { amount: "64.0", currencyCode: "EUR" } },
          merchandise: {
            id: "gid://shopify/ProductVariant/1",
            title: "S",
            price: { amount: "32.0", currencyCode: "EUR" },
            image: image(),
            product: { title: "Jarrón Luna", handle: "jarron-luna" },
          },
        },
        {
          id: "gid://shopify/CartLine/2",
          quantity: 1,
          cost: { totalAmount: { amount: "45.0", currencyCode: "EUR" } },
          merchandise: {
            id: "gid://shopify/ProductVariant/9",
            title: "Default Title",
            price: { amount: "45.0", currencyCode: "EUR" },
            image: null,
            product: { title: "Lámpara Arco", handle: "lampara-arco" },
          },
        },
      ],
    },
  };

  it("mapea líneas, totales y checkoutUrl", () => {
    const c = mapCart(cart);
    expect(c.totalQuantity).toBe(3);
    expect(c.subtotal.amount).toBe(109);
    expect(c.checkoutUrl).toBe("https://stellazon.myshopify.com/cart/c/abc");
    expect(c.lines[0].href).toBe("/productos/jarron-luna");
    expect(c.lines[0].lineTotal.amount).toBe(64);
    expect(c.lines[0].quantity).toBe(2);
  });

  it('oculta el variantTitle "Default Title" de productos sin opciones', () => {
    const c = mapCart(cart);
    expect(c.lines[0].variantTitle).toBe("S");
    expect(c.lines[1].variantTitle).toBeUndefined();
    expect(c.lines[1].image).toBeUndefined();
  });
});
