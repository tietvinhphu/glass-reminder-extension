/** Manifest permissions required by the extension spec. */
export const REQUIRED_MANIFEST_PERMISSIONS = [
  "storage",
  "alarms",
  "notifications",
  "identity",
  "offscreen",
] as const;

/** Host permissions for Google Calendar API access. */
export const REQUIRED_HOST_PERMISSIONS = [
  "https://www.googleapis.com/*",
] as const;

/** Permissions that must never appear in the manifest. */
export const FORBIDDEN_MANIFEST_PERMISSIONS = [
  "tabs",
  "activeTab",
  "history",
  "bookmarks",
] as const;
