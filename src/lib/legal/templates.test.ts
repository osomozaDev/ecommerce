import { describe, expect, it } from "vitest";
import { legalNav, legalPage, LEGAL_SLUGS } from "./templates";
import { hydrateTenant } from "@/lib/tenant/registry";
import tiendaB from "@/config/tenants/tienda-b.json";
import defaultTenant from "@/config/tenants/default.json";

const completo = hydrateTenant(tiendaB); // legal completo + GA4 configurado
const parcial = hydrateTenant(defaultTenant); // solo companyName, sin vendors

const textOf = (slug: string, tenant = completo) =>
  legalPage(slug, tenant)!
    .sections.flatMap((s) => [s.heading, ...s.paragraphs])
    .join("\n");

describe("legalPage", () => {
  it("rellena la plantilla con los datos registrales del tenant", () => {
    const aviso = textOf("aviso-legal");
    expect(aviso).toContain("Norte Atelier S.L.");
    expect(aviso).toContain("B-00000000");
    expect(aviso).toContain("Gijón");
    expect(legalPage("aviso-legal", completo)!.incomplete).toBe(false);
  });

  it("marca como incompleto el tenant con datos parciales y señala los huecos", () => {
    const page = legalPage("aviso-legal", parcial)!;
    expect(page.incomplete).toBe(true);
    expect(textOf("aviso-legal", parcial)).toContain("[pendiente de configurar]");
    expect(textOf("aviso-legal", parcial)).toContain("Stellazon");
  });

  it("la política de cookies lista los vendors SOLO si el tenant los configura", () => {
    expect(textOf("cookies", completo)).toContain("Google Analytics 4");
    expect(textOf("cookies", parcial)).not.toContain("Google Analytics");
    expect(textOf("cookies", parcial)).toContain(
      "no utiliza cookies de analítica ni de publicidad de terceros",
    );
  });

  it("usa los días de devolución del tenant (o 14 por defecto)", () => {
    expect(textOf("devoluciones", completo)).toContain("30 días naturales");
    expect(textOf("devoluciones", parcial)).toContain("14 días naturales");
  });

  it("slug desconocido devuelve null", () => {
    expect(legalPage("terminos-inventados", completo)).toBeNull();
  });
});

describe("legalNav", () => {
  it("enlaza las cuatro páginas legales", () => {
    const nav = legalNav();
    expect(nav).toHaveLength(LEGAL_SLUGS.length);
    expect(nav.map((n) => n.href)).toContain("/legal/privacidad");
    expect(nav.every((n) => n.label.length > 0)).toBe(true);
  });
});
