/** Manifest permissions required by the extension spec. */
export const REQUIRED_MANIFEST_PERMISSIONS = [
  "storage",
  "alarms",
  "notifications",
  "windows", // cần để mở cửa sổ alarm overlay khi tới giờ sự kiện
] as const;

/** Host permissions — hiện không cần (local mode, không gọi API ngoài) */
export const REQUIRED_HOST_PERMISSIONS = [] as const;

/** Permissions that must never appear in the manifest. */
export const FORBIDDEN_MANIFEST_PERMISSIONS = [
  "tabs",
  "activeTab",
  "history",
  "bookmarks",
] as const;
