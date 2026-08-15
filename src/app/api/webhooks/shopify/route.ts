import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS, tenantSecret } from "@/lib/commerce/shopify/client";
import { getTenantByStoreDomain } from "@/lib/tenant/resolve";

/**
 * Receptor de webhooks de Shopify → invalidación selectiva de caché.
 * Multi-tenant: el tenant se resuelve por la cabecera X-Shopify-Shop-Domain
 * (la tienda que dispara el evento), se verifica con SU secreto y se
 * invalidan SOLO sus tags — las demás tiendas no se ven afectadas.
 *
 * Registro en Shopify (admin): Settings → Notifications → Webhooks.
 * Secreto de firma: SHOPIFY_WEBHOOK_SECRET__<TENANT> (fallback sin sufijo).
 * Responde SIEMPRE rápido con 200 tras verificar: Shopify reintenta y acaba
 * eliminando webhooks que fallan repetidamente.
 */

function verifyHmac(rawBody: string, hmacHeader: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  let received: Buffer;
  try {
    received = Buffer.from(hmacHeader, "base64");
  } catch {
    return false;
  }
  return digest.length === received.length && timingSafeEqual(digest, received);
}

export async function POST(request: Request) {
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";
  const tenant = getTenantByStoreDomain(shopDomain);
  if (!tenant) {
    // Tienda no registrada: 200 para no acumular reintentos de Shopify.
    return new Response(`Tienda desconocida: ${shopDomain}`, { status: 200 });
  }

  const secret = tenantSecret("SHOPIFY_WEBHOOK_SECRET", tenant.id);
  if (!secret) {
    console.error(
      `Webhook de ${shopDomain} recibido pero falta SHOPIFY_WEBHOOK_SECRET para el tenant "${tenant.id}"`,
    );
    return new Response("Webhook secret no configurado", { status: 500 });
  }

  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic") ?? "";
  const rawBody = await request.text();

  if (!hmacHeader || !verifyHmac(rawBody, hmacHeader, secret)) {
    return new Response("Firma HMAC inválida", { status: 401 });
  }

  // El payload de los topics *_delete solo trae id (sin handle):
  // en ese caso se invalida el tag amplio y basta.
  let handle: string | undefined;
  try {
    handle = (JSON.parse(rawBody) as { handle?: string }).handle;
  } catch {
    // cuerpo no-JSON: se invalida solo el tag amplio
  }

  if (topic.startsWith("products/")) {
    revalidateTag(CACHE_TAGS.products(tenant.id), "max");
    if (handle) revalidateTag(CACHE_TAGS.product(tenant.id, handle), "max");
  } else if (topic.startsWith("collections/")) {
    revalidateTag(CACHE_TAGS.collections(tenant.id), "max");
    if (handle) revalidateTag(CACHE_TAGS.collection(tenant.id, handle), "max");
  } else {
    // Topic no gestionado: 200 igualmente para que Shopify no reintente.
    return new Response(`Topic ignorado: ${topic}`, { status: 200 });
  }

  return new Response(`Caché invalidada (${tenant.id})`, { status: 200 });
}
