import { describe, expect, it } from "vitest";
import {
  buildTenantFromForm,
  removeStoredTenant,
  upsertStoredTenant,
} from "./store";
import { hydrateTenant } from "@/lib/tenant/registry";

describe("almacén de tenants (helpers puros)", () => {
  it("upsert añade o reemplaza por id sin duplicar", () => {
    const a = { id: "a", v: 1 };
    let list = upsertStoredTenant([], a);
    list = upsertStoredTenant(list, { id: "b" });
    list = upsertStoredTenant(list, { id: "a", v: 2 } as { id: string });
    expect(list).toHaveLength(2);
    expect(list.find((t) => (t as { id: string }).id === "a")).toMatchObject({ v: 2 });
  });

  it("remove elimina por id y tolera ids inexistentes", () => {
    const list = [{ id: "a" }, { id: "b" }];
    expect(removeStoredTenant(list, "a")).toEqual([{ id: "b" }]);
    expect(removeStoredTenant(list, "zz")).toHaveLength(2);
  });
});

describe("buildTenantFromForm", () => {
  function form(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(entries)) fd.set(k, v);
    return fd;
  }

  it("produce un tenant que pasa la hidratación del runtime", () => {
    const raw = buildTenantFromForm(
      form({
        id: "cliente-x",
        nombre: "Cliente X",
        storeDomain: "cliente-x.myshopify.com",
        dominio: "https://cliente-x.com",
        theme: "theme-b",
        razonSocial: "Cliente X S.L.",
        nif: "B12345678",
        email: "hola@cliente-x.com",
        ga4: "G-TEST123456",
      }),
    );
    const tenant = hydrateTenant(raw);
    expect(tenant).toMatchObject({
      id: "cliente-x",
      dataSource: "fixtures",
      branding: { name: "Cliente X" },
      analytics: { ga4MeasurementId: "G-TEST123456" },
      legal: { companyName: "Cliente X S.L.", taxId: "B12345678" },
    });
    expect(tenant.domains).toContain("cliente-x.localhost");
    expect(tenant.theme.name).toBe("theme-b");
    expect(tenant.pages.homepage[0]).toMatchObject({ type: "hero", title: "Cliente X" });
  });

  it("sin razón social usa el nombre y omite opcionales vacíos", () => {
    const raw = buildTenantFromForm(
      form({
        id: "min",
        nombre: "Mínima",
        storeDomain: "min.myshopify.com",
        dominio: "https://min.example.com",
      }),
    ) as { legal: Record<string, unknown>; analytics?: unknown };
    expect(raw.legal.companyName).toBe("Mínima");
    expect("taxId" in raw.legal).toBe(false);
    expect(raw.analytics).toBeUndefined();
    expect(hydrateTenant(raw).theme.name).toBe("theme-a");
  });
});
