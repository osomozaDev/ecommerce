import type { TenantConfig } from "@/lib/tenant/types";
import { legalNav } from "@/lib/legal/templates";

/**
 * Emails transaccionales brandeados POR DATA: la plantilla vive una vez en
 * el engine y se rellena con los tokens del theme y el branding del tenant.
 *
 * Los envía SHOPIFY (sus notificaciones no se pueden desactivar y su
 * infraestructura ya tiene SPF/DKIM): aquí se genera el Liquid listo para
 * pegar en admin → Settings → Notifications, y un preview HTML con datos de
 * muestra para verlo sin enviar nada. Funciones puras → testeables.
 */

export interface EmailTemplate {
  /** Título para humanos (UI/documentación). */
  title: string;
  /** Notificación de Shopify donde pegarlo. */
  shopifyNotification: string;
  /** Asunto (con variables Liquid). */
  subject: string;
  /** Cuerpo completo en Liquid, listo para "Edit code". */
  liquid: string;
  /** El mismo email con datos de muestra (para previsualizar). */
  previewHtml: string;
}

interface OrderEmailValues {
  greetingName: string;
  orderName: string;
  /** Filas de líneas de pedido ya renderizadas. */
  linesHtml: string;
  subtotal: string;
  shipping: string;
  total: string;
  statusUrl: string;
}

function lineRow(tenant: TenantConfig, title: string, price: string): string {
  const { colors } = tenant.theme.tokens;
  return `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:14px;">${title}</td>
<td align="right" style="padding:10px 0;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:14px;white-space:nowrap;">${price}</td>
</tr>`;
}

function button(tenant: TenantConfig, href: string, label: string): string {
  const { colors, buttonRadius } = tenant.theme.tokens;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;"><tr>
<td style="border-radius:${buttonRadius};background:${colors.brand};">
<a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:${colors.brandContrast};text-decoration:none;">${label}</a>
</td></tr></table>`;
}

/** Layout común: banda de marca, tarjeta de contenido y pie con legales. */
function layout(tenant: TenantConfig, bodyHtml: string): string {
  const { colors, fontBody, fontHeading, radius } = tenant.theme.tokens;
  const legales = legalNav()
    .map(
      (item) =>
        `<a href="${tenant.domain}${item.href}" style="color:${colors.muted};text-decoration:underline;">${item.label}</a>`,
    )
    .join(" · ");
  const firma = tenant.legal?.companyName ?? tenant.branding.name;

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${colors.bg};font-family:${fontBody};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};padding:24px 0;"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:94%;">
<tr><td align="center" style="padding:20px 0;">
<span style="font-family:${fontHeading};font-size:22px;font-weight:600;color:${colors.ink};">${tenant.branding.name}</span>
</td></tr>
<tr><td style="background:${colors.surface};border:1px solid ${colors.line};border-radius:${radius};padding:36px 32px;">
${bodyHtml}
</td></tr>
<tr><td align="center" style="padding:24px 16px;color:${colors.muted};font-size:12px;line-height:1.8;">
${firma} · <a href="${tenant.domain}" style="color:${colors.muted};">${new URL(tenant.domain).hostname}</a><br>
${legales}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function orderBody(tenant: TenantConfig, v: OrderEmailValues): string {
  const { colors, fontHeading } = tenant.theme.tokens;
  return `<h1 style="margin:0;font-family:${fontHeading};font-size:24px;font-weight:600;color:${colors.ink};">¡Gracias por tu pedido!</h1>
<p style="margin:14px 0 24px;color:${colors.muted};font-size:14px;line-height:1.6;">Hola ${v.greetingName}: hemos recibido tu pedido <strong style="color:${colors.ink};">${v.orderName}</strong> y ya lo estamos preparando. Te avisaremos cuando salga de camino.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${v.linesHtml}
<tr><td style="padding:12px 0 2px;color:${colors.muted};font-size:13px;">Subtotal</td><td align="right" style="padding:12px 0 2px;color:${colors.ink};font-size:13px;">${v.subtotal}</td></tr>
<tr><td style="padding:2px 0;color:${colors.muted};font-size:13px;">Envío</td><td align="right" style="padding:2px 0;color:${colors.ink};font-size:13px;">${v.shipping}</td></tr>
<tr><td style="padding:8px 0;color:${colors.ink};font-size:15px;font-weight:600;">Total</td><td align="right" style="padding:8px 0;color:${colors.ink};font-size:15px;font-weight:600;">${v.total}</td></tr>
</table>
${button(tenant, v.statusUrl, "Ver estado del pedido")}`;
}

interface ShippingEmailValues {
  orderName: string;
  trackingBlockHtml: string;
  statusUrl: string;
}

function shippingBody(tenant: TenantConfig, v: ShippingEmailValues): string {
  const { colors, fontHeading } = tenant.theme.tokens;
  return `<h1 style="margin:0;font-family:${fontHeading};font-size:24px;font-weight:600;color:${colors.ink};">Tu pedido va de camino</h1>
<p style="margin:14px 0 0;color:${colors.muted};font-size:14px;line-height:1.6;">El pedido <strong style="color:${colors.ink};">${v.orderName}</strong> ya ha salido de nuestro almacén.</p>
${v.trackingBlockHtml}
${button(tenant, v.statusUrl, "Seguir mi pedido")}`;
}

export function orderConfirmationEmail(tenant: TenantConfig): EmailTemplate {
  const liquid = layout(
    tenant,
    orderBody(tenant, {
      greetingName: '{{ customer.first_name | default: "cliente" }}',
      orderName: "{{ name }}",
      linesHtml: `{% for line in subtotal_line_items %}${lineRow(
        tenant,
        "{{ line.title }} × {{ line.quantity }}",
        "{{ line.final_line_price | money }}",
      )}{% endfor %}`,
      subtotal: "{{ subtotal_price | money }}",
      shipping: "{{ shipping_price | money }}",
      total: "{{ total_price | money }}",
      statusUrl: "{{ order_status_url }}",
    }),
  );
  const previewHtml = layout(
    tenant,
    orderBody(tenant, {
      greetingName: "Marta",
      orderName: "#1001",
      linesHtml:
        lineRow(tenant, "Vela aromática Ámbar × 2", "48,00 €") +
        lineRow(tenant, "Manta de lino lavado × 1", "89,00 €"),
      subtotal: "137,00 €",
      shipping: "Gratis",
      total: "137,00 €",
      statusUrl: `${tenant.domain}/cuenta`,
    }),
  );
  return {
    title: "Confirmación de pedido",
    shopifyNotification: "Order confirmation",
    subject: `Pedido {{ name }} confirmado — ${tenant.branding.name}`,
    liquid,
    previewHtml,
  };
}

export function shippingConfirmationEmail(tenant: TenantConfig): EmailTemplate {
  const { colors } = tenant.theme.tokens;
  const trackingLiquid = `{% if fulfillment.tracking_number %}
<p style="margin:14px 0 0;color:${colors.muted};font-size:14px;line-height:1.6;">Seguimiento {{ fulfillment.tracking_company }}: <a href="{{ fulfillment.tracking_url }}" style="color:${colors.brand};">{{ fulfillment.tracking_number }}</a></p>
{% endif %}`;
  const liquid = layout(
    tenant,
    shippingBody(tenant, {
      orderName: "{{ name }}",
      trackingBlockHtml: trackingLiquid,
      statusUrl: "{{ order_status_url }}",
    }),
  );
  const previewHtml = layout(
    tenant,
    shippingBody(tenant, {
      orderName: "#1001",
      trackingBlockHtml: `<p style="margin:14px 0 0;color:${colors.muted};font-size:14px;line-height:1.6;">Seguimiento SEUR: <a href="#" style="color:${colors.brand};">00340434292135100186</a></p>`,
      statusUrl: `${tenant.domain}/cuenta`,
    }),
  );
  return {
    title: "Pedido enviado",
    shopifyNotification: "Shipping confirmation",
    subject: `Tu pedido {{ name }} va de camino — ${tenant.branding.name}`,
    liquid,
    previewHtml,
  };
}

export function emailTemplates(tenant: TenantConfig): EmailTemplate[] {
  return [orderConfirmationEmail(tenant), shippingConfirmationEmail(tenant)];
}
