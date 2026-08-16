import { createHash, randomBytes } from "node:crypto";

/**
 * OAuth 2.0 + PKCE contra la Customer Account API de Shopify (cliente
 * "public": sin client_secret; la prueba es el code_verifier). Este módulo
 * son helpers PUROS (URLs y PKCE) para poder testearlos; la red y las
 * cookies viven en tokens.ts / session.ts.
 */

export interface CustomerAccountConfig {
  shopId: string;
  clientId: string;
}

const AUTH_BASE = "https://shopify.com/authentication";

/** Scope estándar del login de clientes. */
export const CUSTOMER_SCOPE = "openid email customer-account-api:full";

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/** code_challenge S256 (RFC 7636) a partir del code_verifier. */
export function challengeFromVerifier(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizeUrl(options: {
  config: CustomerAccountConfig;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(`${AUTH_BASE}/${options.config.shopId}/oauth/authorize`);
  url.searchParams.set("client_id", options.config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("scope", CUSTOMER_SCOPE);
  url.searchParams.set("state", options.state);
  url.searchParams.set("code_challenge", options.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function tokenEndpoint(config: CustomerAccountConfig): string {
  return `${AUTH_BASE}/${config.shopId}/oauth/token`;
}

/** Cierra también la sesión en Shopify (id_token_hint identifica la sesión). */
export function buildLogoutUrl(options: {
  config: CustomerAccountConfig;
  idToken: string;
  postLogoutRedirectUri: string;
}): string {
  const url = new URL(`${AUTH_BASE}/${options.config.shopId}/logout`);
  url.searchParams.set("id_token_hint", options.idToken);
  url.searchParams.set("post_logout_redirect_uri", options.postLogoutRedirectUri);
  return url.toString();
}
