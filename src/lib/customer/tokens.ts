import "server-only";
import { tokenEndpoint, type CustomerAccountConfig } from "./oauth";
import type { CustomerSession } from "./session";

/** Intercambio y refresco de tokens contra el endpoint OAuth de Shopify. */

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  id_token?: string;
}

async function requestTokens(
  config: CustomerAccountConfig,
  body: Record<string, string>,
): Promise<CustomerSession> {
  const res = await fetch(tokenEndpoint(config), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, ...body }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Shopify OAuth respondió ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as TokenResponse;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    // Margen de 60 s para no usar un token a punto de caducar.
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
    idToken: json.id_token,
  };
}

export function exchangeCodeForSession(options: {
  config: CustomerAccountConfig;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<CustomerSession> {
  return requestTokens(options.config, {
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: options.redirectUri,
    code_verifier: options.codeVerifier,
  });
}

/** Los refresh tokens de Shopify rotan: la sesión devuelta sustituye a la anterior. */
export async function refreshSession(
  config: CustomerAccountConfig,
  session: CustomerSession,
): Promise<CustomerSession> {
  const renewed = await requestTokens(config, {
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });
  // El refresco no devuelve id_token: se conserva para el logout.
  return { ...renewed, idToken: renewed.idToken ?? session.idToken };
}
