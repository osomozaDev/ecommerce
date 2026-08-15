import { describe, expect, it } from "vitest";
import { fixturesProvider } from "./provider";
import { fixtureProducts } from "@/fixtures/products";

describe("fixturesProvider · paginación", () => {
  it("devuelve la primera página con cursor de continuación", async () => {
    const page = await fixturesProvider.getProducts({ first: 3 });
    expect(page.products).toHaveLength(3);
    expect(page.hasNextPage).toBe(true);
    expect(page.endCursor).toBe("3");
  });

  it("continúa desde el cursor sin solapar productos", async () => {
    const primera = await fixturesProvider.getProducts({ first: 3 });
    const segunda = await fixturesProvider.getProducts({
      first: 3,
      after: primera.endCursor!,
    });
    const idsPrimera = primera.products.map((p) => p.id);
    const idsSegunda = segunda.products.map((p) => p.id);
    expect(idsSegunda).toHaveLength(3);
    expect(idsSegunda.some((id) => idsPrimera.includes(id))).toBe(false);
  });

  it("filtra por disponibilidad y rango de precio", async () => {
    const enStock = await fixturesProvider.getProducts({ first: 99, available: true });
    expect(enStock.products.length).toBe(
      fixtureProducts.filter((p) => p.available).length,
    );
    expect(enStock.products.every((p) => p.available)).toBe(true);

    const baratos = await fixturesProvider.getProducts({ first: 99, priceMax: 50 });
    expect(baratos.products.every((p) => p.price.amount <= 50)).toBe(true);

    const medios = await fixturesProvider.getProducts({
      first: 99,
      priceMin: 50,
      priceMax: 100,
    });
    expect(
      medios.products.every((p) => p.price.amount >= 50 && p.price.amount <= 100),
    ).toBe(true);
  });

  it("filtra también dentro de una colección", async () => {
    // iluminacion contiene el difusor agotado
    const result = await fixturesProvider.getCollection("iluminacion", {
      first: 99,
      available: true,
    });
    expect(result?.products.some((p) => p.handle === "difusor-cedro")).toBe(false);
    expect(result?.products.length).toBeGreaterThan(0);
  });

  it("pagina los productos de una colección con cursor", async () => {
    // iluminacion tiene 3 productos en fixtures
    const primera = await fixturesProvider.getCollection("iluminacion", { first: 2 });
    expect(primera?.products).toHaveLength(2);
    expect(primera?.hasNextPage).toBe(true);

    const segunda = await fixturesProvider.getCollection("iluminacion", {
      first: 2,
      after: primera!.endCursor!,
    });
    expect(segunda?.products).toHaveLength(1);
    expect(segunda?.hasNextPage).toBe(false);
  });

  it("señala el final del catálogo", async () => {
    const page = await fixturesProvider.getProducts({
      first: fixtureProducts.length + 10,
    });
    expect(page.products).toHaveLength(fixtureProducts.length);
    expect(page.hasNextPage).toBe(false);
  });
});
