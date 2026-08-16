import { describe, expect, it } from "vitest";
import { emailTemplates, orderConfirmationEmail } from "./templates";
import { hydrateTenant } from "@/lib/tenant/registry";
import tiendaB from "@/config/tenants/tienda-b.json";
import defaultTenant from "@/config/tenants/default.json";

const norte = hydrateTenant(tiendaB); // theme-b, azul #1D3557, legal completo
const stellazon = hydrateTenant(defaultTenant); // theme-a, marrón #8A5A3B

describe("emails transaccionales", () => {
  it("el Liquid lleva las variables de notificación de Shopify", () => {
    const { liquid, subject } = orderConfirmationEmail(norte);
    expect(subject).toContain("{{ name }}");
    expect(liquid).toContain("{% for line in subtotal_line_items %}");
    expect(liquid).toContain("{{ line.final_line_price | money }}");
    expect(liquid).toContain("{{ total_price | money }}");
    expect(liquid).toContain("{{ order_status_url }}");
  });

  it("se brandean con los tokens del theme de CADA tenant", () => {
    const azul = orderConfirmationEmail(norte).previewHtml;
    const marron = orderConfirmationEmail(stellazon).previewHtml;
    expect(azul).toContain("#1D3557");
    expect(azul).not.toContain("#8A5A3B");
    expect(marron).toContain("#8A5A3B");
    expect(azul).toContain("Norte Atelier");
  });

  it("el pie enlaza las legales con URL absoluta del tenant y firma con la razón social", () => {
    const { liquid } = orderConfirmationEmail(norte);
    expect(liquid).toContain(`${norte.domain}/legal/privacidad`);
    expect(liquid).toContain("Norte Atelier S.L.");
  });

  it("el preview usa datos de muestra sin variables Liquid sin resolver", () => {
    for (const template of emailTemplates(norte)) {
      expect(template.previewHtml).not.toContain("{{");
      expect(template.previewHtml).not.toContain("{%");
    }
    expect(orderConfirmationEmail(norte).previewHtml).toContain("#1001");
  });
});
