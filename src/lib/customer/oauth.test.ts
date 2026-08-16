import { describe, expect, it } from "vitest";
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  challengeFromVerifier,
  randomToken,
  tokenEndpoint,
} from "./oauth";
import { decodeSession, encodeSession } from "./session";

const config = { shopId: "60857843734", clientId: "shp_abc123" };

describe("PKCE", () => {
  it("genera el code_challenge S256 del ejemplo de la RFC 7636", () => {
    expect(challengeFromVerifier("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("randomToken es base64url (apto para URL) y suficientemente largo", () => {
    const token = randomToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken()).not.toBe(token);
  });
});

describe("URLs de OAuth", () => {
  it("construye la URL de autorización con todos los parámetros", () => {
    const url = new URL(
      buildAuthorizeUrl({
        config,
        redirectUri: "https://tienda.com/api/cuenta/callback",
        state: "estado123",
        codeChallenge: "reto456",
      }),
    );
    expect(url.origin + url.pathname).toBe(
      "https://shopify.com/authentication/60857843734/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("shp_abc123");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://tienda.com/api/cuenta/callback",
    );
    expect(url.searchParams.get("scope")).toBe("openid email customer-account-api:full");
    expect(url.searchParams.get("state")).toBe("estado123");
    expect(url.searchParams.get("code_challenge")).toBe("reto456");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("endpoint de token y URL de logout por shopId", () => {
    expect(tokenEndpoint(config)).toBe(
      "https://shopify.com/authentication/60857843734/oauth/token",
    );
    const logout = new URL(
      buildLogoutUrl({
        config,
        idToken: "eyJ...",
        postLogoutRedirectUri: "https://tienda.com",
      }),
    );
    expect(logout.pathname).toBe("/authentication/60857843734/logout");
    expect(logout.searchParams.get("id_token_hint")).toBe("eyJ...");
    expect(logout.searchParams.get("post_logout_redirect_uri")).toBe("https://tienda.com");
  });
});

describe("codec de sesión", () => {
  it("encode/decode es un roundtrip", () => {
    const session = {
      accessToken: "shcat_abc",
      refreshToken: "shcrt_def",
      expiresAt: 1789000000000,
      idToken: "eyJ...",
    };
    expect(decodeSession(encodeSession(session))).toEqual(session);
  });

  it("valores corruptos o incompletos devuelven null", () => {
    expect(decodeSession("no-es-base64-json")).toBeNull();
    expect(
      decodeSession(Buffer.from(JSON.stringify({ accessToken: "x" })).toString("base64url")),
    ).toBeNull();
  });
});
