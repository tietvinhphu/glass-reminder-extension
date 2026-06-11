import { describe, expect, it } from "vitest";

import wxtConfig from "../../wxt.config";
import { isOverlyBroadMatchPattern } from "../utils/matchPatterns";

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

    expect(permissions).not.toContain("tabs");
    expect(permissions).not.toContain("activeTab");
    expect(permissions).not.toContain("history");
    expect(permissions).not.toContain("bookmarks");
    for (const pattern of [...permissions, ...hostPermissions]) {
      expect(isOverlyBroadMatchPattern(pattern)).toBe(false);
    }
  });
});
