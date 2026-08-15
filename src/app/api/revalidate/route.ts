import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Revalidación manual de la config de tenants remota (TENANTS_URL).
 * Cuando el JSON remoto cambia (panel futuro, IA, edición a mano), un POST
 * aquí aplica el cambio al instante sin esperar al revalidate periódico:
 *
 *   curl -X POST https://<dominio>/api/revalidate \
 *        -H "Authorization: Bearer $REVALIDATE_SECRET"
 */

function safeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return new Response("REVALIDATE_SECRET no configurado", { status: 500 });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (!safeEquals(auth, `Bearer ${secret}`)) {
    return new Response("No autorizado", { status: 401 });
  }
  revalidateTag("tenants", "max");
  return new Response("Config de tenants revalidada", { status: 200 });
}
