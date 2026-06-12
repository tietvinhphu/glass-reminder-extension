import { describe, expect, it } from "vitest";

import { buildGoogleAuthURL, isExpiringSoon } from "@/src/shared/utils/auth";
import { generatePKCE } from "@/src/shared/utils/crypto";

/**
 * Chuyển Uint8Array sang base64url (không padding) — dùng để verify PKCE challenge
 */
const toBase64Url = (bytes: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

describe("auth utils", () => {
  it("generatePKCE() trả về { codeVerifier, codeChallenge }", async () => {
    const pkce = await generatePKCE();

    expect(pkce).toHaveProperty("codeVerifier");
    expect(pkce).toHaveProperty("codeChallenge");
    expect(typeof pkce.codeVerifier).toBe("string");
    expect(typeof pkce.codeChallenge).toBe("string");
    expect(pkce.codeVerifier.length).toBeGreaterThan(0);
    expect(pkce.codeChallenge.length).toBeGreaterThan(0);
  });

  it("codeChallenge là SHA-256 base64url của codeVerifier", async () => {
    const { codeVerifier, codeChallenge } = await generatePKCE();

    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(codeVerifier),
    );
    const expectedChallenge = toBase64Url(new Uint8Array(digest));

    expect(codeChallenge).toBe(expectedChallenge);
  });

  it("buildGoogleAuthURL(params) có đủ client_id, redirect_uri, scope, code_challenge", () => {
    const params = {
      clientId: "test-client-id.apps.googleusercontent.com",
      redirectUri: "https://test-extension.chromiumapp.org/",
      scope: "https://www.googleapis.com/auth/calendar",
      codeChallenge: "test-code-challenge-value",
    };

    const url = new URL(buildGoogleAuthURL(params));

    expect(url.searchParams.get("client_id")).toBe(params.clientId);
    expect(url.searchParams.get("redirect_uri")).toBe(params.redirectUri);
    expect(url.searchParams.get("scope")).toBe(params.scope);
    expect(url.searchParams.get("code_challenge")).toBe(params.codeChallenge);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("response_type")).toBe("code");
  });

  it("isExpiringSoon(expiresAt, bufferSeconds) → true nếu còn < bufferSeconds", () => {
    const nowSeconds = Date.now() / 1000;
    const bufferSeconds = 300;

    // Token hết hạn sau 60 giây — nhỏ hơn buffer 300s → sắp hết hạn
    expect(isExpiringSoon(nowSeconds + 60, bufferSeconds)).toBe(true);

    // Token hết hạn sau 600 giây — lớn hơn buffer → chưa cần refresh
    expect(isExpiringSoon(nowSeconds + 600, bufferSeconds)).toBe(false);
  });
});
