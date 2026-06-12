import browser from "webextension-polyfill";

import {
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_TOKEN_ENDPOINT,
  TOKEN_EXPIRY_BUFFER_SECONDS,
} from "@/src/shared/constants/api";
import type { GoogleAuthToken } from "@/src/shared/types/auth";
import { buildGoogleAuthURL, isExpiringSoon } from "@/src/shared/utils/auth";
import { generatePKCE } from "@/src/shared/utils/crypto";
import {
  clearToken,
  getToken,
  storeToken,
} from "@/src/shared/utils/tokenStorage";

/** Client ID lấy từ env — không hardcode credentials */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Parse authorization code từ redirect URL sau OAuth popup
 */
const extractAuthorizationCode = (redirectUrl: string): string => {
  const url = new URL(redirectUrl);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    throw new Error(`Google OAuth bị từ chối: ${error}`);
  }

  if (!code) {
    throw new Error("Không tìm thấy authorization code trong redirect URL");
  }

  return code;
};

/**
 * Gộp token mới từ Google với token cũ trong storage
 * Google thường KHÔNG trả refresh_token khi user đăng nhập lại — phải giữ bản cũ
 * Nếu ghi đè bằng chuỗi rỗng, access token hết hạn sẽ không refresh được
 */
export const mergePreservedTokenFields = (
  newToken: GoogleAuthToken,
  existing: GoogleAuthToken | null,
): GoogleAuthToken => ({
  ...newToken,
  refreshToken: newToken.refreshToken || existing?.refreshToken || "",
  email: newToken.email ?? existing?.email,
});

/**
 * Đổi authorization code lấy access + refresh token qua PKCE
 */
const exchangeCodeForToken = async (
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<GoogleAuthToken> => {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange thất bại: ${response.status}`);
  }

  const data = (await response.json()) as GoogleTokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? "",
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  };
};

/**
 * Gọi Google token endpoint để refresh access token
 */
const requestRefreshedToken = async (
  refreshToken: string,
): Promise<GoogleAuthToken> => {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Refresh token thất bại: ${response.status}`);
  }

  const data = (await response.json()) as GoogleTokenResponse;
  const existing = await getToken();

  return {
    accessToken: data.access_token,
    refreshToken: existing?.refreshToken ?? refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    email: existing?.email,
  };
};

/**
 * Mở popup OAuth Google và lưu token đã mã hóa
 * Flow: PKCE → launchWebAuthFlow → exchange code → storeToken
 */
export const launchGoogleOAuth = async (): Promise<GoogleAuthToken> => {
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const redirectUri = browser.identity.getRedirectURL();

  const authUrl = buildGoogleAuthURL({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri,
    scope: GOOGLE_CALENDAR_SCOPE,
    codeChallenge,
  });

  const redirectUrl = await browser.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  if (!redirectUrl) {
    throw new Error("OAuth flow bị hủy hoặc không trả về redirect URL");
  }

  const code = extractAuthorizationCode(redirectUrl);
  const existing = await getToken();
  const exchanged = await exchangeCodeForToken(code, codeVerifier, redirectUri);
  const token = mergePreservedTokenFields(exchanged, existing);

  await storeToken(token);
  return token;
};

/**
 * Refresh access token khi sắp hết hạn
 * Dùng refresh_token đã lưu encrypted trong local storage
 */
export const refreshGoogleToken = async (): Promise<GoogleAuthToken> => {
  const stored = await getToken();

  if (!stored?.refreshToken) {
    throw new Error("Không có refresh token — cần đăng nhập lại");
  }

  const refreshed = await requestRefreshedToken(stored.refreshToken);
  await storeToken(refreshed);
  return refreshed;
};

/**
 * Trả access token hợp lệ — tự refresh nếu còn < 5 phút
 * Hàm này được gọi trước mọi Google Calendar API request
 */
export const getValidGoogleToken = async (): Promise<string> => {
  const stored = await getToken();

  if (!stored) {
    throw new Error("Chưa đăng nhập Google");
  }

  if (isExpiringSoon(stored.expiresAt, TOKEN_EXPIRY_BUFFER_SECONDS)) {
    const refreshed = await refreshGoogleToken();
    return refreshed.accessToken;
  }

  return stored.accessToken;
};

/**
 * Xóa token khi logout — wrapper cho popup/background dùng chung
 */
export const logoutGoogle = async (): Promise<void> => {
  await clearToken();
};
