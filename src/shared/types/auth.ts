/**
 * Token Google OAuth sau khi đăng nhập thành công
 * expiresAt: Unix timestamp (giây) — thời điểm access token hết hạn
 */
export interface GoogleAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email?: string;
}

/**
 * Thông tin user hiển thị trên popup sau khi login
 */
export interface AuthUser {
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Kết quả PKCE — dùng trong OAuth authorization request
 */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Tham số cần thiết để build URL đăng nhập Google
 */
export interface GoogleAuthURLParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  state?: string;
}
