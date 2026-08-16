import { describe, expect, it } from "vitest";
import { languageFromLocale, resolveMarket } from "./market";
import { hydrateTenant, resolveTenantByHost } from "./registry";
import tiendaB from "@/config/tenants/tienda-b.json";

const tenant = hydrateTenant(tiendaB); // mercado "uk" en tienda-b-uk.localhost

describe("resolveMarket", () => {
  it("resuelve el mercado por hostname (ignorando puerto y mayúsculas)", () => {
    const market = resolveMarket("Tienda-B-UK.localhost:3000", tenant);
    expect(market).toMatchObject({
      id: "uk",
      country: "GB",
      language: "EN",
      locale: "en-GB",
    });
  });

  it("host desconocido o nulo → mercado por defecto con el locale del tenant", () => {
    for (const host of ["tienda-b.localhost:3000", null]) {
      const market = resolveMarket(host, tenant);
      expect(market).toMatchObject({ id: "default", country: "ES", locale: "es-ES" });
    }
  });

  it("deriva el LanguageCode del locale cuando el mercado no lo define", () => {
    expect(languageFromLocale("es-ES")).toBe("ES");
    expect(languageFromLocale("en-GB")).toBe("EN");
    const sinMarkets = hydrateTenant({ ...tiendaB, id: "x", markets: undefined });
    expect(resolveMarket(null, sinMarkets)).toMatchObject({
      id: "default",
      country: undefined,
      language: "ES",
    });
  });
});

describe("dominios de mercado", () => {
  it("los dominios de los mercados resuelven al tenant (hydrate los fusiona)", () => {
    expect(tenant.domains).toContain("tienda-b-uk.localhost");
    expect(resolveTenantByHost("tienda-b-uk.localhost:3000", [tenant])?.id).toBe(
      "tienda-b",
    );
  });

  it("valida los mercados en la hidratación", () => {
    expect(() =>
      hydrateTenant({
        ...tiendaB,
        id: "roto",
        markets: { markets: [{ id: "fr", country: "Francia", locale: "fr-FR", domains: ["x"] }] },
      }),
    ).toThrow(/alpha-2/);
    expect(() =>
      hydrateTenant({
        ...tiendaB,
        id: "roto2",
        markets: { markets: [{ id: "fr", country: "FR", locale: "fr-FR", domains: [] }] },
      }),
    ).toThrow(/dominio/);
  });
});
