/** Google OAuth token endpoint — đổi authorization code / refresh token */
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** Scope mặc định: đọc/ghi Google Calendar */
export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar";

/** Buffer refresh token trước khi hết hạn — 5 phút */
export const TOKEN_EXPIRY_BUFFER_SECONDS = 5 * 60;
