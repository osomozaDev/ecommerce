import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant/resolve";
import { exchangeCodeForSession } from "@/lib/customer/tokens";
import {
  CUSTOMER_SESSION_COOKIE,
  encodeSession,
  sessionCookieOptions,
} from "@/lib/customer/session";

/**
 * Vuelta del login de Shopify: valida el state (anti-CSRF), canjea el code
 * con el code_verifier (PKCE) y guarda la sesión en cookie httpOnly.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const fallo = NextResponse.redirect(new URL("/cuenta?error=login", origin));

  const tenant = await getTenant();
  const config = tenant.customerAccount;
  if (!config) return fallo;

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthCookie = request.cookies.get("customer_oauth")?.value;
  if (!code || !state || !oauthCookie) return fallo;

  let stored: { verifier?: string; state?: string };
  try {
    stored = JSON.parse(oauthCookie) as { verifier?: string; state?: string };
  } catch {
    return fallo;
  }
  if (!stored.verifier || stored.state !== state) return fallo;

  try {
    const session = await exchangeCodeForSession({
      config,
      code,
      redirectUri: `${origin}/api/cuenta/callback`,
      codeVerifier: stored.verifier,
    });
    const response = NextResponse.redirect(new URL("/cuenta", origin));
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      encodeSession(session),
      sessionCookieOptions(request.nextUrl.protocol === "https:"),
    );
    response.cookies.delete("customer_oauth");
    return response;
  } catch (error) {
    console.error("Fallo en el intercambio OAuth de cuenta:", error);
    return fallo;
  }
}
