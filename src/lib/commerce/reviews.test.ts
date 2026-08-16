import { describe, expect, it } from "vitest";
import { summarizeReviews } from "./reviews";
import { mapReviewMetaobject } from "./shopify/mappers";
import type { ShopifyMetaobject } from "./shopify/types";
import type { Review } from "./types";

/**
 * Tests del contrato de reseñas: el agregado que consume la UI y el mapper
 * del metaobjeto "review" (la única forma de reseñas en la Storefront API).
 */

const review = (rating: number, id = `r-${rating}`): Review => ({
  id,
  author: "Cliente",
  rating,
  body: "Texto",
  date: "1 de enero de 2026",
});

describe("summarizeReviews", () => {
  it("calcula media a 1 decimal y cuenta", () => {
    const summary = summarizeReviews([review(5, "a"), review(4, "b"), review(4, "c")]);
    expect(summary.count).toBe(3);
    expect(summary.averageRating).toBe(4.3);
    expect(summary.reviews).toHaveLength(3);
  });

  it("sin reseñas devuelve agregado vacío (no rompe la ficha)", () => {
    expect(summarizeReviews([])).toEqual({ averageRating: 0, count: 0, reviews: [] });
  });
});

const metaobject = (
  fields: Record<string, string | null>,
  id = "gid://shopify/Metaobject/1",
): ShopifyMetaobject => ({
  id,
  fields: Object.entries(fields).map(([key, value]) => ({ key, value })),
});

describe("mapReviewMetaobject", () => {
  const valid = {
    product: "vela-ambar",
    author: "Marta G.",
    rating: "5",
    title: "Genial",
    body: "Muy contenta con la compra.",
    date: "2026-06-03",
  };

  it("mapea un metaobjeto completo con la fecha formateada en el locale", () => {
    const mapped = mapReviewMetaobject(metaobject(valid), "es-ES")!;
    expect(mapped.productHandle).toBe("vela-ambar");
    expect(mapped.review).toMatchObject({
      author: "Marta G.",
      rating: 5,
      title: "Genial",
      body: "Muy contenta con la compra.",
    });
    expect(mapped.review.date).toContain("2026");
    expect(mapped.review.date).toContain("junio");
  });

  it("tolera title y date ausentes", () => {
    const mapped = mapReviewMetaobject(
      metaobject({ product: "vela-ambar", author: "Ana", rating: "4", body: "Bien." }),
      "es-ES",
    )!;
    expect(mapped.review.title).toBeUndefined();
    expect(mapped.review.date).toBe("");
  });

  it("descarta reseñas sin campos imprescindibles o con rating inválido", () => {
    expect(mapReviewMetaobject(metaobject({ ...valid, product: null }), "es-ES")).toBeNull();
    expect(mapReviewMetaobject(metaobject({ ...valid, body: null }), "es-ES")).toBeNull();
    expect(mapReviewMetaobject(metaobject({ ...valid, rating: "6" }), "es-ES")).toBeNull();
    expect(mapReviewMetaobject(metaobject({ ...valid, rating: "4.5" }), "es-ES")).toBeNull();
    expect(mapReviewMetaobject(metaobject({ ...valid, rating: null }), "es-ES")).toBeNull();
  });
});
