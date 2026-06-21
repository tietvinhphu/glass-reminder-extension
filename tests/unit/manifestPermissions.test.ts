import { describe, expect, it } from "vitest";

import {
  FORBIDDEN_MANIFEST_PERMISSIONS,
  REQUIRED_HOST_PERMISSIONS,
  REQUIRED_MANIFEST_PERMISSIONS,
} from "../../src/shared/constants/manifest";
import {
  isHttpsOnlyHostPermission,
  isValidManifestMatchPattern,
} from "../utils/matchPatterns";

describe("manifest permission contract", () => {
  it("lists only least-privilege permissions from the extension spec", () => {
    // Local mode: extension không gọi API ngoài, chỉ cần storage/alarms/notifications/windows.
    // identity/offscreen sẽ được thêm lại khi OAuth/Calendar thật sự chạy.
    expect(REQUIRED_MANIFEST_PERMISSIONS).toEqual([
      "storage",
      "alarms",
      "notifications",
      "windows",
    ]);
  });

  it("does not overlap forbidden store-risky permissions", () => {
    for (const permission of REQUIRED_MANIFEST_PERMISSIONS) {
      expect(FORBIDDEN_MANIFEST_PERMISSIONS).not.toContain(permission);
    }
  });

  it("declares zero host permissions (local mode, không gọi API ngoài)", () => {
    // Local mode không cần host_permissions. Khi OAuth/Calendar được bật,
    // test này sẽ được đổi lại expect 2 URL Google như trước.
    expect(REQUIRED_HOST_PERMISSIONS).toEqual([]);

    for (const permission of REQUIRED_HOST_PERMISSIONS) {
      expect(isHttpsOnlyHostPermission(permission)).toBe(true);
      expect(permission).not.toBe("<all_urls>");
      expect(permission).not.toBe("*://*/*");
    }
  });

  it("uses valid MV3 host permission syntax for API endpoints", () => {
    // Không có host_permissions trong local mode → loop rỗng, pass tự nhiên.
    // Khi bật lại OAuth/Calendar, loop này sẽ verify isValidManifestMatchPattern cho 2 URL Google.
    for (const permission of REQUIRED_HOST_PERMISSIONS) {
      expect(isValidManifestMatchPattern(permission)).toBe(true);
    }
  });
});
