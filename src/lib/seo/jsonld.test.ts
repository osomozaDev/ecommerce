import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, productBreadcrumb, productJsonLd } from "./jsonld";
import { fixtureProducts, findFixtureProduct } from "@/fixtures/products";
import { defaultTenant } from "@/config/tenants/default";

const tenant = defaultTenant;

describe("productJsonLd", () => {
  it("genera AggregateOffer con rango de precios para productos con variantes", () => {
    const jarron = findFixtureProduct("jarron-luna")!; // 2 variantes: 32 y 45
    const ld = productJsonLd(jarron, tenant) as Record<string, unknown>;
    expect(ld["@type"]).toBe("Product");
    expect(ld.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "32.00",
      highPrice: "45.00",
      offerCount: 2,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    });
  });

  it("genera Offer simple para productos de una variante", () => {
    const lampara = findFixtureProduct("lampara-arco")!;
    const ld = productJsonLd(lampara, tenant) as Record<string, unknown>;
    expect(ld.offers).toMatchObject({ "@type": "Offer", price: "149.00" });
  });

  it("marca OutOfStock cuando el producto está agotado", () => {
    const difusor = findFixtureProduct("difusor-cedro")!;
    const ld = productJsonLd(difusor, tenant) as { offers: { availability: string } };
    expect(ld.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("convierte urls e imágenes relativas en absolutas con el dominio del tenant", () => {
    const ld = productJsonLd(fixtureProducts[0], tenant) as {
      url: string;
      image: string[];
    };
    expect(ld.url).toBe(`${tenant.domain}/productos/vela-ambar`);
    expect(ld.image[0].startsWith(`${tenant.domain}/fixtures/`)).toBe(true);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numera posiciones y resuelve urls absolutas", () => {
    const producto = fixtureProducts[0];
    const ld = breadcrumbJsonLd(productBreadcrumb(producto), tenant) as {
      itemListElement: { position: number; name: string; item: string }[];
    };
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0]).toMatchObject({
      position: 1,
      name: "Inicio",
      item: `${tenant.domain}/`,
    });
    expect(ld.itemListElement[2].item).toBe(`${tenant.domain}${producto.href}`);
  });
});
