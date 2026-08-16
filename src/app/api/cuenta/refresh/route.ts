import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant/resolve";
import { refreshSession } from "@/lib/customer/tokens";
import {
  CUSTOMER_SESSION_COOKIE,
  decodeSession,
  encodeSession,
  sessionCookieOptions,
} from "@/lib/customer/session";

/**
 * Refresco del access token (las páginas no pueden escribir cookies:
 * /cuenta redirige aquí cuando la sesión está caducada). Si el refresh
 * token ya no vale, se limpia la sesión y se vuelve al login.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  // Solo rutas internas como destino (nada de open redirects).
  const returnToParam = request.nextUrl.searchParams.get("returnTo") ?? "/cuenta";
  const returnTo = returnToParam.startsWith("/") && !returnToParam.startsWith("//")
    ? returnToParam
    : "/cuenta";

  const tenant = await getTenant();
  const config = tenant.customerAccount;
  const stored = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = stored ? decodeSession(stored) : null;
  if (!config || !session) {
    const response = NextResponse.redirect(new URL("/cuenta", origin));
    response.cookies.delete(CUSTOMER_SESSION_COOKIE);
    return response;
  }

  try {
    const renewed = await refreshSession(config, session);
    const response = NextResponse.redirect(new URL(returnTo, origin));
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      encodeSession(renewed),
      sessionCookieOptions(request.nextUrl.protocol === "https:"),
    );
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/cuenta", origin));
    response.cookies.delete(CUSTOMER_SESSION_COOKIE);
    return response;
  }
}
