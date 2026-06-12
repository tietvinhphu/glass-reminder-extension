/** Manifest permissions required by the extension spec. */
export const REQUIRED_MANIFEST_PERMISSIONS = [
  "storage",
  "alarms",
  "notifications",
  "identity",
  "offscreen",
] as const;

/** Host permissions cho Google Calendar API và OAuth token exchange */
export const REQUIRED_HOST_PERMISSIONS = [
  "https://www.googleapis.com/*",
  // PKCE đổi code qua fetch — subdomain khác www, cần quyền riêng
  "https://oauth2.googleapis.com/*",
] as const;

/** Permissions that must never appear in the manifest. */
export const FORBIDDEN_MANIFEST_PERMISSIONS = [
  "tabs",
  "activeTab",
  "history",
  "bookmarks",
] as const;
