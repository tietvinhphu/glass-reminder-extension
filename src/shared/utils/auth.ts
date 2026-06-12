import type { GoogleAuthURLParams } from "@/src/shared/types/auth";

/** Endpoint authorization Google OAuth 2.0 */
const GOOGLE_AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * Tạo URL đăng nhập Google với PKCE params
 * clientId: OAuth client ID từ Google Cloud Console
 * redirectUri: URL redirect extension (chrome.identity.getRedirectURL)
 * scope: quyền truy cập Calendar API
 * codeChallenge: SHA-256 base64url của code_verifier
 */
export const buildGoogleAuthURL = (params: GoogleAuthURLParams): string => {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);

  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  if (params.state) {
    url.searchParams.set("state", params.state);
  }

  return url.toString();
};

/**
 * Kiểm tra access token có sắp hết hạn không
 * expiresAt: Unix timestamp (giây) lúc token hết hạn
 * bufferSeconds: refresh sớm nếu còn ít hơn số giây này
 */
export const isExpiringSoon = (
  expiresAt: number,
  bufferSeconds: number,
): boolean => {
  const nowSeconds = Date.now() / 1000;
  const remainingSeconds = expiresAt - nowSeconds;
  return remainingSeconds < bufferSeconds;
};
