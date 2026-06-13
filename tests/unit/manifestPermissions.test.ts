import { describe, expect, it } from "vitest";

import {
  FORBIDDEN_MANIFEST_PERMISSIONS,
  REQUIRED_HOST_PERMISSIONS,
  REQUIRED_MANIFEST_PERMISSIONS,
} from "@/src/shared/constants/manifest";

describe("manifest permission contract", () => {
  it("lists only least-privilege permissions from the extension spec", () => {
    expect(REQUIRED_MANIFEST_PERMISSIONS).toEqual([
      "storage",
      "alarms",
      "notifications",
    ]);
  });

  it("does not overlap forbidden store-risky permissions", () => {
    for (const permission of REQUIRED_MANIFEST_PERMISSIONS) {
      expect(FORBIDDEN_MANIFEST_PERMISSIONS).not.toContain(permission);
    }
  });

  it("does not require host permissions in local mode", () => {
    expect(REQUIRED_HOST_PERMISSIONS).toEqual([]);
  });
});
