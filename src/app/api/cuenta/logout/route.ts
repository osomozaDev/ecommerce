import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant/resolve";
import { buildLogoutUrl } from "@/lib/customer/oauth";
import { CUSTOMER_SESSION_COOKIE, decodeSession } from "@/lib/customer/session";

/**
 * Cierra la sesión local (borra la cookie) y, si hay id_token, también la
 * sesión en Shopify para que el próximo login pida credenciales de nuevo.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const tenant = await getTenant();
  const config = tenant.customerAccount;

  const stored = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = stored ? decodeSession(stored) : null;

  const destination =
    config && session?.idToken
      ? buildLogoutUrl({
          config,
          idToken: session.idToken,
          postLogoutRedirectUri: origin,
        })
      : new URL("/", origin).toString();

  const response = NextResponse.redirect(destination);
  response.cookies.delete(CUSTOMER_SESSION_COOKIE);
  return response;
}
