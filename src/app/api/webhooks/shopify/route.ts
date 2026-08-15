import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/commerce/shopify/client";

/**
 * Receptor de webhooks de Shopify → invalidación selectiva de caché.
 *
 *   Shopify (products/*, collections/*)
 *     → POST /api/webhooks/shopify   (HMAC verificado)
 *     → revalidateTag(...)           (la siguiente visita re-consulta Shopify)
 *
 * Registro en Shopify (admin): Settings → Notifications → Webhooks.
 * El secreto de firma que aparece en esa página va en SHOPIFY_WEBHOOK_SECRET.
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
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Webhook Shopify recibido pero SHOPIFY_WEBHOOK_SECRET no está configurado");
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
    revalidateTag(CACHE_TAGS.products, "max");
    if (handle) revalidateTag(CACHE_TAGS.product(handle), "max");
  } else if (topic.startsWith("collections/")) {
    revalidateTag(CACHE_TAGS.collections, "max");
    if (handle) revalidateTag(CACHE_TAGS.collection(handle), "max");
  } else {
    // Topic no gestionado: 200 igualmente para que Shopify no reintente.
    return new Response(`Topic ignorado: ${topic}`, { status: 200 });
  }

  return new Response("Caché invalidada", { status: 200 });
}
