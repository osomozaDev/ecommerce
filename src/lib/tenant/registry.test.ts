import { describe, expect, it } from "vitest";
import { hydrateTenant, resolveTenantByHost } from "./registry";
import defaultTenantData from "@/config/tenants/default.json";
import tiendaBData from "@/config/tenants/tienda-b.json";

const tenants = [hydrateTenant(defaultTenantData), hydrateTenant(tiendaBData)];

describe("hydrateTenant", () => {
  it("hidrata los JSON reales del repo y resuelve el theme por nombre", () => {
    const [stellazon, norte] = tenants;
    expect(stellazon.id).toBe("default");
    expect(stellazon.theme.name).toBe("theme-a");
    expect(norte.theme.name).toBe("theme-b");
    expect(norte.pages.homepage.length).toBeGreaterThan(0);
  });

  it("rechaza un tenant sin storeDomain válido", () => {
    expect(() =>
      hydrateTenant({ ...defaultTenantData, id: "roto", shopify: { storeDomain: "no" } }),
    ).toThrow(/storeDomain/);
  });

  it("rechaza una referencia de theme inexistente", () => {
    expect(() =>
      hydrateTenant({ ...defaultTenantData, theme: "no-existe" }),
    ).toThrow(/theme "no-existe" no existe/);
  });

  it("descarta bloques de tipo desconocido sin romper", () => {
    const t = hydrateTenant({
      ...defaultTenantData,
      pages: { homepage: [{ type: "hero", title: "Hola" }, { type: "futuro-bloque" }] },
    });
    expect(t.pages.homepage).toHaveLength(1);
  });
});

describe("resolveTenantByHost", () => {
  it("resuelve por el hostname del dominio canónico", () => {
    const t = resolveTenantByHost("ecommerce-one-theta-33.vercel.app", tenants);
    expect(t?.id).toBe("default");
  });

  it("resuelve por alias e ignora el puerto y las mayúsculas", () => {
    const t = resolveTenantByHost("Tienda-B.localhost:3000", tenants);
    expect(t?.id).toBe("tienda-b");
  });

  it("devuelve null para hosts desconocidos (→ fallback TENANT_ID)", () => {
    expect(resolveTenantByHost("otro-dominio.com", tenants)).toBeNull();
    expect(resolveTenantByHost(null, tenants)).toBeNull();
  });
});
