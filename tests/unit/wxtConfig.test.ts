import { describe, expect, it } from "vitest";

import { FORBIDDEN_MANIFEST_PERMISSIONS } from "@/src/shared/constants/manifest";
import wxtConfig from "../../wxt.config";
import { isHttpsOnlyHostPermission } from "../utils/matchPatterns";

describe("wxt.config", () => {
  it("sets the extension manifest identity", () => {
    expect(wxtConfig.manifest).toMatchObject({
      name: "Glass Reminder Extension",
      description: "Glass Calendar & Smart Reminder Extension",
      version: "1.0.0",
    });
  });

  it("configures Edge as the primary development browser", () => {
    expect(wxtConfig.runner?.binaries?.chrome).toContain("msedge.exe");
  });

  it("does not request store-risky broad permissions in manifest", () => {
    const manifest = wxtConfig.manifest as
      | { permissions?: string[]; host_permissions?: string[] }
      | undefined;
    const permissions = manifest?.permissions ?? [];
    const hostPermissions = manifest?.host_permissions ?? [];

    for (const forbidden of FORBIDDEN_MANIFEST_PERMISSIONS) {
      expect(permissions).not.toContain(forbidden);
    }

    expect(hostPermissions).not.toContain("<all_urls>");
    expect(hostPermissions).not.toContain("*://*/*");

    for (const hostPermission of hostPermissions) {
      expect(isHttpsOnlyHostPermission(hostPermission)).toBe(true);
    }
  });
});
