import { describe, expect, it } from "vitest";
import { parseWishlist, WISHLIST_MAX } from "./read";

describe("parseWishlist", () => {
  it("acepta un array de handles válidos", () => {
    expect(parseWishlist('["vela-ambar","lampara-arco"]')).toEqual([
      "vela-ambar",
      "lampara-arco",
    ]);
  });

  it("descarta basura sin romper (cookie manipulada)", () => {
    expect(parseWishlist(undefined)).toEqual([]);
    expect(parseWishlist("no-json{")).toEqual([]);
    expect(parseWishlist('{"a":1}')).toEqual([]);
    expect(parseWishlist('["ok",42,null,"<script>","también no"]')).toEqual(["ok"]);
  });

  it("recorta al máximo permitido", () => {
    const many = JSON.stringify(Array.from({ length: 200 }, (_, i) => `p-${i}`));
    expect(parseWishlist(many)).toHaveLength(WISHLIST_MAX);
  });
});
