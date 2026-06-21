import { describe, expect, it } from "vitest";

import {
  FORBIDDEN_MANIFEST_PERMISSIONS,
  REQUIRED_HOST_PERMISSIONS,
  REQUIRED_MANIFEST_PERMISSIONS,
} from "@/shared/constants/manifest";
import {
  isHttpsOnlyHostPermission,
  isValidManifestMatchPattern,
} from "../utils/matchPatterns";

describe("manifest permission contract", () => {
  it("lists only least-privilege permissions from the extension spec", () => {
    expect(REQUIRED_MANIFEST_PERMISSIONS).toEqual([
      "storage",
      "alarms",
      "notifications",
      "identity",
      "offscreen",
    ]);
  });

  it("does not overlap forbidden store-risky permissions", () => {
    for (const permission of REQUIRED_MANIFEST_PERMISSIONS) {
      expect(FORBIDDEN_MANIFEST_PERMISSIONS).not.toContain(permission);
    }
  });

  it("scopes API access to Google Calendar and OAuth token endpoint over HTTPS only", () => {
    expect(REQUIRED_HOST_PERMISSIONS).toEqual([
      "https://www.googleapis.com/*",
      "https://oauth2.googleapis.com/*",
    ]);

    for (const permission of REQUIRED_HOST_PERMISSIONS) {
      expect(isHttpsOnlyHostPermission(permission)).toBe(true);
      expect(permission).not.toBe("<all_urls>");
      expect(permission).not.toBe("*://*/*");
    }
  });

  it("uses valid MV3 host permission syntax for API endpoints", () => {
    for (const permission of REQUIRED_HOST_PERMISSIONS) {
      expect(isValidManifestMatchPattern(permission)).toBe(true);
    }
  });
});
