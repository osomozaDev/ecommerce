import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant/resolve";
import {
  buildAuthorizeUrl,
  challengeFromVerifier,
  randomToken,
} from "@/lib/customer/oauth";

/**
 * Inicio del login OAuth + PKCE: genera verifier y state, los guarda en una
 * cookie httpOnly efímera y redirige al login alojado de Shopify.
 * El redirect_uri usa el ORIGIN de la request (registrar en el admin tanto
 * el dominio de producción como http://localhost:3000).
 */
export async function GET(request: NextRequest) {
  const tenant = await getTenant();
  const config = tenant.customerAccount;
  if (!config) {
    return NextResponse.redirect(new URL("/cuenta", request.nextUrl.origin));
  }

  const verifier = randomToken();
  const state = randomToken();
  const redirectUri = `${request.nextUrl.origin}/api/cuenta/callback`;

  const response = NextResponse.redirect(
    buildAuthorizeUrl({
      config,
      redirectUri,
      state,
      codeChallenge: challengeFromVerifier(verifier),
    }),
  );
  response.cookies.set("customer_oauth", JSON.stringify({ verifier, state }), {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
